({
    getDataHelper: function(component, event) {
        var action = component.get("c.getRecords");
        //Set the Object parameters and Field Set name
        action.setParams({
            recordId: component.get('v.recordId'),
            strFieldSetName: component.get('v.fieldSetAPI'),
            childObject: component.get('v.childAPIName')
        });

        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === 'SUCCESS') {
                component.set("v.columns", response.getReturnValue().lstDataTableColumns);
                component.set("v.displayData", response.getReturnValue().lstDataTableData);
                component.set("v.rawData", response.getReturnValue().lstDataTableData);
            }
            else if (state === 'ERROR') {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " +
                            errors[0].message);
                    }
                }
                else {
                    console.log("Unknown error");
                }
            }
            else {
                console.log('Something went wrong, Please check with your admin');
            }
        });
        $A.enqueueAction(action);
    },

    saveTable: function(component, event, helper) {
        var editedRecords = event.getParam('draftValues');
        var totalRecordEdited = editedRecords.length;
        var action = component.get("c.updateRecords");
        action.setParams({
            'editedRecordJSON': JSON.stringify(editedRecords),
            'strObjectName': component.get('v.childAPIName'),
            'parentId': component.get('v.recordId'),
            'parentField': component.get("v.parentField")
        });
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                //if update is successful
                if (response.getReturnValue() === true) {
                    component.find('notifLib').showToast({
                        "variant": "success",
                        "title": "Record Update",
                        "message": totalRecordEdited + " Records Updated"
                    });
                    helper.getDataHelper(component, event);
                    //helper.reloadDataTable();
                }
                else {
                    component.find('notifLib').showToast({
                        "variant": "error",
                        "title": "Something has gone wrong!",
                        "message": "Unfortunately, there was a problem updating the records."
                    });
                }
            }
            else {
                console.error("Was that a flying monkey?");
                component.find('notifLib').showToast({
                    "variant": "error",
                    "title": "Unfortunately, there was a problem updating the records.",
                    "message": response.getError()[0].message
                });
            }
        });
        $A.enqueueAction(action);
    },

    sortData: function(cmp, fieldName, sortDirection) {
        var data = cmp.get("v.displayData");
        var reverse = sortDirection !== 'asc';
        //sorts the rows based on the column header that's clicked
        data.sort(this.sortBy(fieldName, reverse));
        cmp.set("v.displayData", data);
    },
    sortBy: function(field, reverse, primer) {
        var key = primer ?
            function(x) { return primer(x[field]) } :
            function(x) { return x[field] };
        //checks if the two rows should switch places
        reverse = !reverse ? 1 : -1;
        return function(a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        };
    },

    reloadDataTable: function() {
        var refreshEvent = $A.get("e.force:refreshView");
        if (refreshEvent) {
            refreshEvent.fire();
        }
    },

    showModal: function(component, event, helper) {
        component.find("filtermodal").show(function(success) {
            if (success == false) return;
            helper.updateFilter(component, event, helper);
        });
    },

    setFilter: function(component, event, helper) {
        var actionName = event.getParam('action').name.replace('filter-', '');
        var activeFilter = component.get('v.activeFilter');
        component.find('fieldFilter').set('v.filter', activeFilter[actionName] ? activeFilter[actionName].value : '');
        component.find('fieldFilter').set('v.filterType', activeFilter[actionName] ? activeFilter[actionName].filterType : '');
    },

    updateFilter: function(component, event, helper) {

        var actionName = event.getParam('action').name.replace('filter-', '');

        var activeFilter = component.get('v.activeFilter');

        var filterCmp = component.find('fieldFilter');
        var newFilter = {
            value: filterCmp.get('v.filter'),
            filterType: filterCmp.get('v.filterType')
        };
        if (newFilter.filterType === '') {
            newFilter = undefined;
        }
        activeFilter[actionName] = newFilter;

        var colDef = event.getParam('columnDefinition');
        var columns = component.get('v.columns');
        var idx = columns.indexOf(colDef);
        if (newFilter) {
            columns[idx].iconName = 'utility:filterList';
        }
        else {
            columns[idx].iconName = '';
        }
        component.set('v.columns', columns);


        component.set('v.activeFilter', activeFilter);
        helper.filterRows(component);
    },


    filterRows: function(cmp) {
        var rows = cmp.get('v.rawData');
        var activeFilter = cmp.get('v.activeFilter');
        var filteredRows = rows;

        filteredRows = rows.filter(function(row) {
            let show = true;
            for (var prop in activeFilter) {
                if (activeFilter.hasOwnProperty(prop) && activeFilter[prop]) {
                    switch (activeFilter[prop].filterType) {
                        case 'equals':
                            show = show && row[prop] === activeFilter[prop].value;
                            break;
                        case 'contains':
                            show = show && row[prop] && row[prop].includes(activeFilter[prop].value);
                            break;
                        case 'starts':
                            show = show && row[prop] && row[prop].startsWith(activeFilter[prop].value);
                            break;
                        case 'ends':
                            show = show && row[prop] && row[prop].endsWith(activeFilter[prop].value);
                            break;
                        case 'less':
                            show = show && row[prop] < activeFilter[prop].value;
                            break;
                        case 'greater':
                            show = show && row[prop] > activeFilter[prop].value;
                            break;
                        case 'blank':
                            show = show && (row[prop] === '' || row[prop] === undefined);
                            break;
                        case 'notblank':
                            show = show && row[prop] !== '' && row[prop] !== undefined;
                            break;
                        default:
                            show = false;
                    }
                }

            }
            return show;
        });

        cmp.set('v.displayData', filteredRows);
    }
})