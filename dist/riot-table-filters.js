riot.tag2('riot-table-filter-boolean', '<div class="filter"> <label for="{opts.as}"> {opts.label} <input type="checkbox" name="{opts.as}" onclick="{clicked}"> </label> </div>', '', '', function(opts) {
        this.mixin(RiotTableMixin);

        this.on('mount', function(){
            this[opts.as].checked = !!this.opts.value;
        })
        this.clicked = function(e)
        {
            this.observable.trigger('filter', opts.key, this[opts.as].checked);
        }.bind(this)
});



riot.tag2('riot-table-filter-range', '<div class="filter"> <label for="{opts.as}">{opts.label}</label> <input name="{opts.as}1" onchange="{changed}" min="{opts.min}" max="opts.max" step="{opts.step}" type="number"> <input name="{opts.as}2" onchange="{changed}" min="{opts.min}" max="opts.max" step="{opts.step}" type="number"> </div>', '', '', function(opts) {
        this.mixin(RiotTableMixin);

        this.on('mount', function(){
        })

        this.clicked = function(e)
        {
            this.observable.trigger('filter', opts.key, this[opts.as].checked);
        }.bind(this)
});
