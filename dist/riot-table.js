riot.tag2('riot-table', '<yield></yield> <input if="{opts.search}" type="text" onkeyup="{onKeyup}"> <table name="el" class="{opts.class}"> <thead> <tr name="labels"> <th each="{c in tags[\'riot-table-col\']}" onclick="{sortMulti}" data-order="{c.opts.sorter ? c.opts.order || \'asc\' : \'\'}" data-key="{c.opts.key}" riot-style="width: {c.opts.width || \'auto\'}"> {c.opts.label} <span class="subsup"> <sup></sup> <sub>{c.parent.opts.multicolumn ? c.parent.sortees.indexOf(c.opts.key) > -1 ? c.parent.sortees.indexOf(c.opts.key) + 1 : \'\' : \'\'}</sub> </span> </th> </tr> </thead> <tbody name="tbody"></tbody> </table>', '', '', function(opts) {
		this.mixin(RiotTableMixin);

		var self = this,
			doc = document,
			rowClick = opts.onclick,
			_selected = 'tr__selected';

		self.cols = [];
		self.rows = [];
		self.keys = [];
		self.widths = {};
		self.builders = {};
		self.sorters = {};
		self.selected = null;

		self.sortees = [];

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

		self.drawRow = function (data, idx) {
			var tr = doc.createElement('tr');
			tr.id = data.id || 'tr-' + idx;

			tr.onclick = function (e) {
				e.item = this;
				self.onRowClick(e);
			};

			drawCells(tr, data);

			return tr;
		};

		function drawCells(tr, data) {

			self.keys.forEach(function (key) {
				var td = doc.createElement('td');
				td.width = self.widths[key];

				var builder = buildCell(key, data);

				td.value = builder.isMutated ? data[key] : builder.value;
				td.innerHTML = '<div class="td__inner">'+ builder.value +'</div>';

				tr.appendChild(td);
			});
		}

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

		self.searchTable = function (val) {

			var rgx = new RegExp(val.trim().replace(/[ ,]+/g, '|'), 'i');

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
				return e['element'];
			});

			console.time('re-append');
			self.rows.forEach(function (el) {
				self.tbody.appendChild(el);
			});
			console.timeEnd('re-append');
		}

		self.on('mount', function () {
			self.cols = [].slice.call(self.labels.children);

			self.tags['riot-table-col'].forEach(function (c) {
				var k = c.opts.key;

				self.keys.push(k);
				self.widths[k] = c.opts.width || 'auto';

				self.builders[k] = c.opts.render || false;

				self.sorters[k] = c.opts.sorter || false;

				self.root.removeChild(c.root);
			});

			if (opts.actions) {
				self.actionsCol = parseInt(opts.actions);
			}

			console.info('mount sending `update`');
			self.update();
		});

		self.on('update', function () {
			console.warn('inside `riot-table` update');
			if (self.keys.length && opts.data.length > self.rows.length) {
				self.drawRows();
			}
		});

		this.observable.on('filter', function(key, constraints){
			console.log(key, constraints);
		});
});
