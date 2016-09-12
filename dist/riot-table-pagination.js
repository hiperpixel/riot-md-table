riot.tag2('riot-table-pagination', '<div class="rt-pagination"> <riot-table-pagination-link each="{p in self.pages}"></riot-table-pagination-link> </div>', '', '', function(opts) {
        this.mixin(EventHub);

        var self = this;

        self.perPage = opts.perPage || 10;
        self.maxLinks = opts.maxLinks || 7;
        self.showExtremes = !!opts.showExtremes || true;
        self.curPage = opts.curPage || 1;
        self.totalRecords;
        self.pages;

        this.on('mount', function(){
            pagination_on();
        });

        function pagination_on()
        {
            console.log('activating paginator', opts.as);
            self.observable.trigger('pagination_on', opts.as, this);
        }
        function pagination_off()
        {
            self.observable.trigger('pagination_off', opts.as);
        }

        function exec(data)
        {
            self.totalRecords = data.length;
            console.log(self.totalRecords);
        }
});


riot.tag2('riot-table-pagination-link', '<span class="{1:rt-pagination-link opts.active:\'active\'}"> {opts.pageNumber} </span>', '', '', function(opts) {
        var self = this;
});
