var Sortable = function(element, scrollable){
    var self = this;
    this.scrollable = scrollable || document.body;
    this.element = element;
    this.items   = this.element.querySelectorAll(this.element.dataset.sortable);
    this.setPositions();
    window.addEventListener("resize", _.debounce(function(){
       self.setPositions();
    }, 200));
    interact(this.element.dataset.sortable, {
        context: this.element
    }).draggable({
        inertia: false,
        manualStart: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        autoScroll: {
            container: this.scrollable === document.body ? null : this.scrollable,
            margin: 50,
            speed: 600
        },
        onmove: _.throttle(function(e){
            self.move(e);
        }, 16, {trailing: false})
    }).on("dragstart", function(e){
        var r = e.target.getBoundingClientRect();
        e.target.classList.add("is-dragged");
        self.startPosition = e.target.dataset.position;
        self.offset = {
            x: e.clientX - r.left,
            y: e.clientY - r.top
        };
        self.scrollTopStart = self.scrollable.scrollTop;
    }).on("dragend", function(e){
        e.target.classList.remove("is-dragged");
        self.moveItem(e.target, e.target.dataset.position);
        self.sendResults();
    }).on("hold", function(e){
        if(!e.interaction.interacting()){
            e.interaction.start({
                name: "drag"
            }, e.interactable, e.currentTarget);
        }
    });
};

Sortable.prototype.setPositions = function(){
    var self = this;
    var rect = this.items[0].getBoundingClientRect();
    this.item_width = Math.floor(rect.width);
    this.item_height = Math.floor(rect.height);
    this.cols = Math.floor(this.element.offsetWidth / this.item_width);
    this.element.style.height = (this.item_height * Math.ceil(this.items.length / this.cols)) + "px";
    for(var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        item.style.position = "absolute";
        item.style.top = "0px";
        item.style.left = "0px";
        item.style.transitionDuration = "0s";
        this.moveItem(item, item.dataset.position);
    }
    window.setTimeout(function(){
         for(var i = 0; i < self.items.length; i++) {
            var item = self.items[i];
            item.style.transitionDuration = null;
         }
    }, 100);
};

Sortable.prototype.move = function(e){
    var p = this.getXY(this.startPosition);
    var x = p.x + e.clientX - e.clientX0;
    var y = p.y + e.clientY - e.clientY0 + this.scrollable.scrollTop - this.scrollTopStart;
    e.target.style.transform = "translate3D(" + x + "px, " + y + "px, 0)";
    var oldPosition = parseInt(e.target.dataset.position, 10);
    var newPosition = this.guessPosition(x + this.offset.x, y + this.offset.y);
    if(oldPosition !== newPosition){
        this.swap(oldPosition, newPosition);
        e.target.dataset.position = newPosition;
    }
    this.guessPosition(x, y);
};

Sortable.prototype.getXY = function(position){
    var x = this.item_width * (position % this.cols);
    var y = this.item_height * Math.floor(position / this.cols);
    return {
        x: x,
        y: y
    };
};

Sortable.prototype.guessPosition = function(x, y){
    var col = Math.floor(x / this.item_width);
    if(col >= this.cols){
        col = this.cols - 1;
    }
    if(col <= 0){
        col = 0;
    }
    var row = Math.floor(y / this.item_height);
    if(row < 0){
        row = 0;
    }
    var position = col + row * this.cols;
    if(position >= this.items.length){
        return this.items.length - 1;
    }
    return position;
};

Sortable.prototype.swap = function(start, end){
    for(var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        if(!item.classList.contains("is-dragged")){
            var position = parseInt(item.dataset.position, 10);
            if(position >= end && position < start && end < start){
                this.moveItem(item, position + 1);
            } else if(position <= end && position > start && end > start){
                this.moveItem(item, position - 1);
            }
        }
    }
};

Sortable.prototype.moveItem = function(item, position){
    var p = this.getXY(position);
    item.style.transform = "translate3D(" + p.x + "px, " + p.y + "px, 0)";
    item.dataset.position = position;
};

Sortable.prototype.sendResults = function(){
    var results = {};
    for(var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        results[item.dataset.id] = item.dataset.position;
    }
    this.success(results);
};