<riot-table>
	<yield />

	<input if="{ opts.search }" type="text" onkeyup="{ onKeyup }">

	<table name="el" class="{opts.class}">
		<thead>
			<tr name="labels">
				<th each="{ c in tags['riot-table-col'] }" onclick="{ c.opts.sorter ? sortColumn : ''}"
					data-order="{ c.opts.sorter ? c.opts.order || 'asc' : '' }"
					data-key="{ c.opts.key }" style="width: { c.opts.width || 'auto' }"
					class="{c.opts.sorter ? 'sortable': '' }">
					{ c.opts.label }
					<span class="sort_dir" if="{ c.parent.keyIsSortee(c.opts.key) }">
						<span class="dir_{ c.parent.dirOfSortee(c.opts.key) }">
							<span>{ c.parent.dirOfSortee(c.opts.key) }</span>
						</span>
						<span class="order" if="{c.parent.opts.multicolumn}">
							<span>{ c.parent.idOfSortee(c.opts.key) + 1 }</span>
						</span>
					</span>
				</th>
			</tr>
		</thead>

		<tbody name="tbody"></tbody>
	</table>

	<script>
		this.mixin(EventHub);

		var self = this,
			doc = document,
			rowClick = opts.onclick,
			_selected = 'tr__selected';		// to be removed

		self.cols = []; // the `thead th` elements
		self.keys = []; // the datakeys per column
		self.widths = {}; // the widths per column
		self.builders = {}; // cols render methods
		self.sorters = {}; // cols sorting methods
		self.selected = null; // selected row item
		self.visible_rows = []; // data to display
		self.sortees = []; // what columns to sort

		/**
		* Get the id of the column in the sortee array
		*/
		self.idOfSortee = function (key)
		{
			return self.sortees.findIndex(function(e){
				return e.key == key;
			}, this);
		}

		/**
		* Get the id of the column in the sortee array
		*/
		self.keyIsSortee = function (key)
		{
			return self.idOfSortee(key) > -1;
		}

		/**
		* Get the current sorting direction of the column in the sortee array
		*/
		self.dirOfSortee = function (key)
		{
			idx = self.idOfSortee(key);
			return idx > -1 ? self.sortees[idx].dir : false;
		}

		/**
		 * Draw all table rows within `opts.data`
		 */
		self.drawRows = function ()
		{
			while(self.tbody.firstChild)
			{
				self.tbody.removeChild(self.tbody.firstChild);
			}

			self.visible_rows.forEach(function (row, i)
			{
				var item = self.drawRow(row, i)
				self.tbody.appendChild(item);
			});
		};

		/**
		 * Draw a single row
		 * @param  {Array} data   The row's data object
		 * @param  {Integer} idx  The row's index within `opts.data`
		 * @return {Node}         The constructed row
		 */
		self.drawRow = function (data, idx)
		{
			var tr = doc.createElement('tr');
			tr.id = data.id || 'tr-' + idx;

			// mock-up riot's e.item object (since no dom-loop)
			tr.onclick = function (e)
			{
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
		function drawCells(tr, data)
		{
			// loop thru keys
			self.keys.forEach(function (key)
			{
				var td = doc.createElement('td');
				td.width = self.widths[key];
				td.innerHTML = '<div>' + buildCell(key, data) + '</div>';
				tr.appendChild(td); // add this `<td>` to the `<tr>`
			});
		}

		/**
		 * Determine a single cell's value
		 * @param  {String} key  The cell col's key name
		 * @param  {Object} data The row's data object
		 * @return {Object}      The cell's computed values
		 */
		function buildCell(key, data)
		{
			return self.builders[key] ? self.builders[key](data) : data[key];
		}

		// Returns a function, that, as long as it continues to be invoked, will not
		// be triggered. The function will be called after it stops being called for
		// N milliseconds. If `immediate` is passed, trigger the function on the
		// leading edge, instead of the trailing.
		// https://davidwalsh.name/javascript-debounce-function
		function debounce(func, wait, immediate)
		{
			var timeout;
			return function()
			{
				var context = this, args = arguments;
				var later = function()
				{
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
		self.onRowClick = function (e)
		{
			if (self.selected)
			{
				classList.remove(self.selected, _selected);
			}

			classList.add(e.item, _selected);

			self.selected = e.item;

			if (rowClick)
			{
				rowClick(e.item);
			}
		};

		self.onKeyup = debounce(function (e)
		{
			self.searchTable(e.target.value);
		}, 250);

		/**
		 * Use the Search's value to hide non-matching rows
		 * @param  {String} val   The search input's value
		 */
		self.searchTable = function (val)
		{
			// split by spaces or commas, read as "OR"
			var rgx = new RegExp(val.trim().replace(/[ ,]+/g, '|'), 'i');
			// test each cell by what's displaying (not always original value)
			[].forEach.call(self.tbody.getElementsByTagName('td'), function (td) {
				td.parentNode.style.display = rgx.test(td.innerText) ? 'table-row' : 'none';
			});
		};

		self.sortColumn = function(e)
		{
			var th = e.target;
			var key = th.getAttribute('data-key');
			var curr_dir = self.dirOfSortee(key);
			var dir_sequence = ['asc', 'desc'];

			if(!self.sorters[key])
			{
				return;
			}

			if(th.getAttribute('data-order') === 'desc')
			{
				dir_sequence.reverse();
			}

			var curr_dir_idx = curr_dir ? dir_sequence.indexOf(curr_dir) : -1;
			var next_dir_idx = ((curr_dir_idx + 1) % dir_sequence.length);
			var next_dir = dir_sequence[next_dir_idx];
			var disabled = curr_dir_idx + 1 == dir_sequence.length;

			if(opts.multicolumn)
			{
				var index = self.idOfSortee(key);

				if(index >= 0)
				{
					self.sortees.splice(index, 1);
				}

				if(!disabled)
				{
					self.sortees.push({key:key, dir:next_dir});
				}
			}
			else
			{
				self.sortees = disabled ? [] : [{key:key, dir:next_dir}];
			}

			sortData();
		}

		function sortData()
		{
			var sort_function;

			self.sortees.forEach(function(e, i)
			{
				var opts = [];

				opts['direction'] = (e.dir == 'desc' ? -1 : 1);

				if( i == 0 )
				{
					sort_function = firstBy(self.sorters[e.key], opts);
				}
				else
				{
					sort_function = sort_function.thenBy(self.sorters[e.key], opts);
				}
			});

			self.visible_rows.sort(sort_function);
		}

		/**
		 * On Init, Prepare & Collect `riot-table-col` stats
		 */
		self.on('mount', function ()
		{
			self.cols = [].slice.call(self.labels.children); // get `<th>` after loop runs

			// save the columns' datakeys & widths. will be used for `<td>` childs
			self.tags['riot-table-col'].forEach(function (c)
			{
				var k = c.opts.key;

				self.keys.push(k);
				self.widths[k] = c.opts.width || 'auto';

				// has a custom renderer?
				self.builders[k] = c.opts.render || false;
				// has a sorter method?
				self.sorters[k] = c.opts.sorter || false;

				// remove the `<riot-table-col>` tags from DOM, useless now
				self.root.removeChild(c.root);
			});

			// check if there's an Actions column
			if (opts.actions)
			{
				self.actionsCol = parseInt(opts.actions);
			}

			self.visible_rows = opts.data;

			self.update();
		});

		/**
		 * On `update`, draw the tablerows if has new data
		 */
		self.on('update', function ()
		{
			// TODO find a way to prevent too many unecessary draws
			sortData();
			self.drawRows();
		});

		this.observable.on('filter', function(label, filter)
		{
			if(opts.filters.indexOf(label)>-1)
			{
				self.visible_rows = filter.exec(opts.data);
				self.update();
			}
		});
	</script>
</riot-table>
