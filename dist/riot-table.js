riot.tag2('riot-table', '<yield></yield> <input if="{opts.search}" type="text" onkeyup="{onKeyup}"> <table name="el" class="{opts.class}"> <thead> <tr name="labels"> <th each="{c in tags[\'riot-table-col\']}" onclick="{c.opts.sorter ? sortColumn : \'\'}" data-order="{c.opts.sorter ? c.opts.order || \'asc\' : \'\'}" data-key="{c.opts.key}" riot-style="width: {c.opts.width || \'auto\'}" class="{c.opts.sorter ? \'sortable\': \'\'}"> {c.opts.label} <span class="sort_dir" if="{c.parent.keyIsSortee(c.opts.key)}"> <span class="dir_{c.parent.dirOfSortee(c.opts.key)}"> <span>{c.parent.dirOfSortee(c.opts.key)}</span> </span> <span class="order" if="{c.parent.opts.multicolumn}"> <span>{c.parent.idOfSortee(c.opts.key) + 1}</span> </span> </span> </th> </tr> </thead> <tbody name="tbody"></tbody> </table>', '', '', function(opts) {
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
		self.filters = [];

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

			for(var i = 0; i< self.visible_rows.length ; i++)
			{
				var item = self.drawRow(self.visible_rows[i], i)
				self.tbody.appendChild(item);
			}
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

			for(var i = 0; i < self.keys.length; i++)
			{
				var key = self.keys[i];
				var td = doc.createElement('td');
				td.width = self.widths[key];
				td.innerHTML = '<div>' + buildCell(key, data) + '</div>';
				tr.appendChild(td);
			}
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
		}

		function sortData(data)
		{
			var sort_function;
			var ret = data.slice(0);

			if(self.sortees.length > 0)
			{
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

				ret.sort(sort_function);
			}

			return ret;
		}

		function filterData(data)
		{
			var ret = data.slice(0);
			for(var label in self.filters)
			{
				ret = self.filters[label].exec(ret);
			}
			return ret;
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

			self.update();
		});

		self.on('update', function ()
		{

			console.time('Updating...');
			self.visible_rows = sortData( filterData( opts.data ) );
			self.drawRows();
			console.timeEnd('Updating...');
		});

		this.observable.on('filter_on', function(label, filter)
		{
			if(opts.filters.indexOf(label) > -1)
			{
				if(!self.filters[label])
					self.filters[label] = filter;

				self.update();
			}
		});

		this.observable.on('filter_off', function(label)
		{
			if(opts.filters.indexOf(label) > -1 && self.filters[label])
			{
				delete self.filters[label];
				self.update();
			}
		});

});
