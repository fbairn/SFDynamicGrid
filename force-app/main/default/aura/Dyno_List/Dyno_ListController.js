({
    doInit: function(component, event, helper) {
        helper.getColumns(component, event, helper);
    },

    selectItem: function(component, event, helper) {
        // 		helper.selectItem(component, event, helper);
    },

    changeColumns: function(component, event, helper) {
        helper.generateTable(component, event, helper);
    }
})