riot.tag2('riot-table-filter-select', '<div class="filter"> <div class="filter_active"><span>Active</span><input type="checkbox" name="_active" onclick="{changed}"></div> <label for="{opts.as}"> {opts.label} <select name="{opts.as}" onchange="{changed}" __disabled="{!_active.checked}"> <option each="{label, value in opts.list}" value="{label}">{label}</option> </select> </label> </div>', '', '', function(opts) {
        this.mixin(EventHub);

        this.on('mount', function()
        {
            this[opts.as].checked = !!this.opts.value;
        });

        this.changed = function(e)
        {
            if (this['_active'].checked)
            {
                this.observable.trigger('filter_on', opts.as, this);
            }
            else
            {
                this.observable.trigger('filter_off', opts.as);
            }
        }.bind(this)

        this.getValue = function(label)
        {
            return this.opts.list[label];
        }.bind(this)

        this.exec = function(data)
        {
            return data.filter(function(e)
            {
                if (this['_active'].checked)
                {
                    console.log(e[this.opts.key], this.getValue(this[opts.as].value));
                    return e[this.opts.key] === this.getValue(this[opts.as].value);
                }
                return true;
            }, this);
        }.bind(this)
});
