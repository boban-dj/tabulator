var History = function(table){
	this.table = table; //hold Tabulator object

	this.history = [];
	this.index = -1;
};


History.prototype.clear = function(){
	this.history = [];
	this.index = -1;
};

History.prototype.action = function(type, component, data){

	if(this.index > -1){
		this.history = this.history.slice(0, this.index + 1);
	}

	this.history.push({
		type:type,
		component:component,
		data:data,
	});

	this.index ++;
};

History.prototype.undo = function(){

	if(this.index > -1){

		let action = this.history[this.index];

		this.undoers[action.type].call(this, action);

		this.index--;

		return true;
	}else{
		console.warn("History Undo Error - No more history to undo");
		return false;
	}

};

History.prototype.redo = function(){
	if(this.history.length-1 > this.index){

		this.index++;

		let action = this.history[this.index];

		this.redoers[action.type].call(this, action);

		return true;
	}else{
		console.warn("History Redo Error - No more history to redo");
		return false;
	}
};


History.prototype.undoers = {
	cellEdit: function(action){
		action.component.setValueProcessData(action.data.oldValue);
	},

	rowAdd: function(action){
		action.component.delete();
	},

	rowDelete: function(action){
		var newRow = this.table.rowManager.addRowActual(action.data.data, action.data.pos, action.data.index);

		this._rebindRow(action.component, newRow);
	},
};


History.prototype.redoers = {
	cellEdit: function(action){
		action.component.setValueProcessData(action.data.newValue);
	},

	rowAdd: function(action){
		var newRow = this.table.rowManager.addRowActual(action.data.data, action.data.pos, action.data.index);

		this._rebindRow(action.component, newRow);
	},

	rowDelete:function(action){
		action.component.delete();
	},
};

//rebind rows to new element after deletion
History.prototype._rebindRow = function(oldRow, newRow){
	this.history.forEach(function(action){
		if(action.component instanceof Row){
			if(action.component === oldRow){
				action.component = newRow;
			}
		}else if(action.component instanceof Cell){
			if(action.component.row === oldRow){
				var field = action.component.column.getField();

				if(field){
					action.component = newRow.getCell(field);
				}

			}
		}
	});
};

Tabulator.registerExtension("history", History);