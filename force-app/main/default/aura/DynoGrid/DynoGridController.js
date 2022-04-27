({
    init: function(component, event, helper) {
        component.set('v.activeFilter', {});
        helper.getDataHelper(component, event);
    },
    handleSaveEdition: function(cmp, event, helper) {
        helper.saveTable(cmp, event, helper);
    },
    handleCancelEdition: function(cmp) {
        // do nothing for now...
    },
    // Client-side controller called by the onsort event handler
    updateColumnSorting: function(cmp, event, helper) {
        var fieldName = event.getParam('fieldName');
        var sortDirection = event.getParam('sortDirection');
        // assign the latest attribute with the sorted column fieldName and sorted direction
        cmp.set("v.sortedBy", fieldName);
        cmp.set("v.sortedDirection", sortDirection);
        helper.sortData(cmp, fieldName, sortDirection);
    },

    handleHeaderAction: function(cmp, event, helper) {
        var actionName = event.getParam('action').name;
        if (actionName.startsWith('filter-')) {
            helper.setFilter(cmp, event, helper);
            helper.showModal(cmp, event, helper);
        }
    },

    handleAdd: function(cmp, event, helper) {
        var display = cmp.get("v.displayData");
        var raw = cmp.get("v.rawData");

        var newRow = { "Id": '' };
        display.push(newRow);
        raw.push(newRow);
        cmp.set("v.displayData", display);
        cmp.set("v.rawData", raw);
    }
})