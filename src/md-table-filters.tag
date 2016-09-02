<riot-table-filter-boolean>
    <div class="filter">
        <label for="{opts.as}">
            {opts.label}
            <input type="checkbox" name="{opts.as}" onclick="{clicked}">
        </label>
    </div>

    <script>
        this.mixin(RiotTableMixin);

        this.on('mount', function(){
            this[opts.as].checked = !!this.opts.value;
        })
        clicked(e)
        {
            this.observable.trigger('filter', opts.key, this[opts.as].checked);
        }
    </script>
</riot-table-filter-boolean>



<riot-table-filter-range>
    <div class="filter">
        <label for="{opts.as}">{opts.label}</label>
        <input type="number" name="{opts.as}1" onchange="{changed}" min="{opts.min}" max="opts.max" step="{opts.step}">
        <input type="number" name="{opts.as}2" onchange="{changed}" min="{opts.min}" max="opts.max" step="{opts.step}">
    </div>

    <script>
        this.mixin(RiotTableMixin);

        this.on('mount', function(){
        })

        clicked(e)
        {
            this.observable.trigger('filter', opts.key, this[opts.as].checked);
        }
    </script>
</riot-table-filter-range>
