({
	show : function(component, event, helper){
        var params = event.getParam('arguments');
        if (params) {
        	component.set('v.callback',params.callback);
        }
		component.set('v.showModal', true);
	},
	
	handleSave : function(component, event, helper) {
		component.get('v.callback')(true);
		component.set('v.showModal', false);
	},
	
	handleCancel : function(component, event, helper) {
		component.get('v.callback')(false);
		component.set('v.showModal', false);
	}
})