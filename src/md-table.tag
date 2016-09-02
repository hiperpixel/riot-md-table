<md-table>
	<yield />

	<input if="{ opts.search }"
		type="text" onkeyup="{ onKeyup }">

	<table name="el" class="{opts.class}">
		<thead>
			<tr name="labels">
				<th each="{ c in tags['md-table-col'] }" onclick="{ sortMulti }"
					data-order="{ c.opts.sorter ? c.opts.order || 'asc' : '' }"
					data-key="{ c.opts.key }" style="width: { c.opts.width || 'auto' }">
					{ c.opts.label }
					<span class="subsup">
						<sup></sup>
						<sub>{ c.parent.opts.multicolumn ? c.parent.sortees.indexOf(c.opts.key) > -1 ? c.parent.sortees.indexOf(c.opts.key) + 1 : '' : '' }</sub>
					</span>
				</th>
			</tr>
		</thead>

		<tbody name="tbody"></tbody>
	</table>

	<script>
		this.mixin(SharedMixin);

		var self = this,
			doc = document,
			rowClick = opts.onclick,
			_selected = 'tr__selected';

		self.cols = []; // the `thead th` elements
		self.rows = []; // the `tbody tr` elements
		self.keys = []; // the datakeys per column
		self.widths = {}; // the widths per column
		self.builders = {}; // cols render methods
		self.sorters = {}; // cols sorting methods
		self.selected = null; // selected row item

		self.sortees = []; // orders for multicolumn sort

		/**
		 * Draw all table rows within `opts.data`
		 */
		self.drawRows = function () {
			console.time('first draw');
			self.rows = [];
			opts.data.forEach(function (row, i) {
				var item = self.drawRow(row, i)
				self.rows.push(item);
				self.tbody.appendChild(item);
			});
			console.timeEnd('first draw');
		};

		/**
		 * Draw a single row
		 * @param  {Array} data   The row's data object
		 * @param  {Integer} idx  The row's index within `opts.data`
		 * @return {Node}         The constructed row
		 */
		self.drawRow = function (data, idx) {
			var tr = doc.createElement('tr');
			tr.id = data.id || 'tr-' + idx;

			// mock-up riot's e.item object (since no dom-loop)
			tr.onclick = function (e) {
				e.item = this;
				self.onRowClick(e);
			};

			drawCells(tr, data);

			// send back the full `<tr>` row
			return tr;
		};

		/**
		 * Build & Attach `<td>` nodes to a `<tr>`
		 * @param  {Node}   tr
		 * @param  {Object} data   The row's data object
		 */
		function drawCells(tr, data) {
			// loop thru keys
			self.keys.forEach(function (key) {
				var td = doc.createElement('td');
				td.width = self.widths[key];

				// check if this cell should be mutated
				var builder = buildCell(key, data);

				// table looks @ this & will use for sorter
				td.value = builder.isMutated ? data[key] : builder.value;
				td.innerHTML = '<div class="td__inner">'+ builder.value +'</div>';

				// add this `<td>` to the `<tr>`
				tr.appendChild(td);
			});
		}

		/**
		 * Determine a single cell's value
		 * @param  {String} key  The cell col's key name
		 * @param  {Object} data The row's data object
		 * @return {Object}      The cell's computed values
		 */
		function buildCell(key, data) {
			var val, isMutated = false;

			if (self.builders[key]) {
				val = self.builders[key](data);
				isMutated = true;
			} else {
				val = data[key];
			}

			return {isMutated: isMutated, value: val};
		}

		// Returns a function, that, as long as it continues to be invoked, will not
		// be triggered. The function will be called after it stops being called for
		// N milliseconds. If `immediate` is passed, trigger the function on the
		// leading edge, instead of the trailing.
		// https://davidwalsh.name/javascript-debounce-function
		function debounce(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		};

		/**
		 * Assign a `click` handler to each row
		 * - Func is passed in via `tr.onclick`
		 */
		self.onRowClick = function (e) {
			if (self.selected) {
				classList.remove(self.selected, _selected);
			}

			classList.add(e.item, _selected);

			self.selected = e.item;

			if (rowClick) {
				rowClick(e.item);
			}
		};

		self.onKeyup = debounce(function (e) {
			self.searchTable(e.target.value);
		}, 250);

		/**
		 * Use the Search's value to hide non-matching rows
		 * @param  {String} val   The search input's value
		 */
		self.searchTable = function (val) {
			// split by spaces or commas, read as "OR"
			var rgx = new RegExp(val.trim().replace(/[ ,]+/g, '|'), 'i');
			// test each cell by what's displaying (not always original value)
			[].forEach.call(self.tbody.getElementsByTagName('td'), function (td) {
				td.parentNode.style.display = rgx.test(td.innerText) ? 'table-row' : 'none';
			});
		};


		self.sortMulti = function(e) {
			var th = e.target,
				key = th.getAttribute('data-key'),
				sorter = self.sorters[key];

			var sorted = th.getAttribute('data-sort');
			var order_sequence = ['asc', 'desc'];
			if(th.getAttribute('data-order') === 'desc')
				order_sequence.reverse();
			if(opts.multicolumn)
				order_sequence.push('none');

			var order_actual = sorted ? order_sequence.indexOf(sorted) : -1;
			var next_state = ((order_actual + 1) % order_sequence.length);
			var order = order_sequence[next_state];

			if(opts.multicolumn)
			{
				var index = self.sortees.indexOf(key);
				if(index >= 0)
					self.sortees.splice(index, 1);

				if(order != 'none')
					self.sortees.push(key);

				th.setAttribute('data-sort', order);
			}
			else
			{
				self.sortees = [key];

				self.cols.forEach(function (el, i) {
					if (i === self.actionsCol) {
						return;
					}
					if (el === th) {
						el.setAttribute('data-sort', order);
					} else {
						el.removeAttribute('data-sort');
					}
				});
			}

			function find_cols_indexes()
			{
				var idx = [];
				self.sortees.forEach(function(e){
					idx.push(
						self.cols.findIndex(function(v){
							return v.getAttribute('data-key') == e;
						})
					);
				});
				return idx;
			}

			function get_col_direction(name)
			{
				return self.cols.find(function(v){
					return v.getAttribute('data-key') == name;
				}).getAttribute('data-sort');
			}

			function get_cols_directions()
			{
				dir = []
				self.sortees.forEach(function(e) {
					dir.push(get_col_direction(e));
				});
				return dir;
			}

			function extract_row(j, idx)
			{
				var r = [];
				r['element'] = self.rows[j];
				idx.forEach(function(v, i){
					r[self.sortees[i]] = ( self.rows[j].children[v].value );
				});
				return r;
			}

			cols = find_cols_indexes();
			cols_dirs = get_cols_directions();
			rows = [];
			for (i=0;i<self.rows.length;i++)
			{
				rows.push(extract_row(i, cols))
			}

			// TODO: fuse cols and cols_dirs into a named array {key:{idx:i, dir:d}}

			// console.log(self.sortees);
			// console.log(cols);
			// console.log(cols_dirs);
			// console.log(rows);

			// SORT

			var sort_function;

			self.sortees.forEach(function(e, i){
				var opts = [];

				opts['direction'] = (cols_dirs[i] == 'desc' ? -1 : 1);

				if( i == 0 ){
					sort_function = firstBy(self.sorters[e], opts);
				} else {
					sort_function = sort_function.thenBy(self.sorters[e], opts);
				}
			});

			sorted = rows.sort(sort_function);

			self.rows = sorted.map(function (e) {
				return e['element']; // `<tr>` is 2nd item of tuple
			});

			// REPLENISH TABLE
			// Write to `<tbody` without duplicating
			console.time('re-append');
			self.rows.forEach(function (el) {
				self.tbody.appendChild(el);
			});
			console.timeEnd('re-append');
		}

		/**
		 * On Init, Prepare & Collect `md-table-col` stats
		 */
		self.on('mount', function () {
			self.cols = [].slice.call(self.labels.children); // get `<th>` after loop runs

			// save the columns' datakeys & widths. will be used for `<td>` childs
			self.tags['md-table-col'].forEach(function (c) {
				var k = c.opts.key;

				self.keys.push(k);
				self.widths[k] = c.opts.width || 'auto';

				// has a custom renderer?
				self.builders[k] = c.opts.render || false;
				// has a sorter method?
				self.sorters[k] = c.opts.sorter || false;

				// remove the `<md-table-col>` tags from DOM, useless now
				self.root.removeChild(c.root);
			});

			// check if there's an Actions column
			if (opts.actions) {
				self.actionsCol = parseInt(opts.actions);
			}

			console.info('mount sending `update`');
			self.update();
		});

		/**
		 * On `update`, draw the tablerows if has new data
		 */
		self.on('update', function () {
			console.warn('inside `md-table` update');
			if (self.keys.length && opts.data.length > self.rows.length) {
				self.drawRows();
			}
		});

		this.observable.on('filter', function(key, constraints){
			console.log(key, constraints);
		});
	</script>
</md-table>
