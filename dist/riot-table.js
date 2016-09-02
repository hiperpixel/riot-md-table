riot.tag2('riot-table', '<yield></yield> <input if="{opts.search}" type="text" onkeyup="{onKeyup}"> <table name="el" class="{opts.class}"> <thead> <tr name="labels"> <th each="{c in tags[\'riot-table-col\']}" onclick="{c.opts.sorter ? sort_column : \'\'}" data-order="{c.opts.sorter ? c.opts.order || \'asc\' : \'\'}" data-key="{c.opts.key}" riot-style="width: {c.opts.width || \'auto\'}" class="{c.opts.sorter ? \'sortable\': \'\'}"> {c.opts.label} <span class="sort_dir" if="{c.parent.keyIsSortee(c.opts.key)}"> <span class="dir_{c.parent.dirOfSortee(c.opts.key)}"> <span>{c.parent.dirOfSortee(c.opts.key)}</span> </span> <span class="order" if="{c.parent.opts.multicolumn}"> <span>{c.parent.idOfSortee(c.opts.key) + 1}</span> </span> </span> </th> </tr> </thead> <tbody name="tbody"></tbody> </table>', '', '', function(opts) {
		this.mixin(EventHub);

		var self = this,
			doc = document,
			rowClick = opts.onclick,
			_selected = 'tr__selected';

		self.cols = [];
		self.keys = [];
		self.widths = {};
		self.builders = {};
		self.sorters = {};
		self.selected = null;
		self.visible_rows = [];
		self.sortees = [];

		self.idOfSortee = function (key)
		{
			return self.sortees.findIndex(function(e){
				return e.key == key;
			}, this);
		}

		self.keyIsSortee = function (key)
		{
			return self.idOfSortee(key) > -1;
		}

		self.dirOfSortee = function (key)
		{
			idx = self.idOfSortee(key);
			return idx > -1 ? self.sortees[idx].dir : false;
		}

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

		self.drawRow = function (data, idx)
		{
			var tr = doc.createElement('tr');
			tr.id = data.id || 'tr-' + idx;

			tr.onclick = function (e)
			{
				e.item = this;
				self.onRowClick(e);
			};

			drawCells(tr, data);

			return tr;
		};

		function drawCells(tr, data)
		{

			self.keys.forEach(function (key)
			{
				var td = doc.createElement('td');
				td.width = self.widths[key];
				td.innerHTML = '<div>' + buildCell(key, data) + '</div>';
				tr.appendChild(td);
			});
		}

		function buildCell(key, data)
		{
			return self.builders[key] ? self.builders[key](data) : data[key];
		}

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

		self.searchTable = function (val)
		{

			var rgx = new RegExp(val.trim().replace(/[ ,]+/g, '|'), 'i');

			[].forEach.call(self.tbody.getElementsByTagName('td'), function (td) {
				td.parentNode.style.display = rgx.test(td.innerText) ? 'table-row' : 'none';
			});
		};

		self.sort_column = function(e)
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

			sort_data();
		}

		function sort_data()
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

		self.on('mount', function ()
		{
			self.cols = [].slice.call(self.labels.children);

			self.tags['riot-table-col'].forEach(function (c)
			{
				var k = c.opts.key;

				self.keys.push(k);
				self.widths[k] = c.opts.width || 'auto';

				self.builders[k] = c.opts.render || false;

				self.sorters[k] = c.opts.sorter || false;

				self.root.removeChild(c.root);
			});

			if (opts.actions)
			{
				self.actionsCol = parseInt(opts.actions);
			}

			self.visible_rows = opts.data;

			self.update();
		});

		self.on('update', function ()
		{

			sort_data();
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
});
