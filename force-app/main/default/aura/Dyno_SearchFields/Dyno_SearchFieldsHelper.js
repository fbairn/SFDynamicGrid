({
    getFilterFields: function(component, event, helper) {
        var action = component.get('c.getFieldSetApxc');

        action.setParams({
            fieldSetName: component.get('v.fieldSet'),
            objectAPIName: component.get('v.objectType')
        });

        action.setCallback(this, function(response) {
            console.log('Filter callback: ', response)
            if (response.getState() === 'SUCCESS') {
                helper.setupFilterFields(component, event, helper, response.getReturnValue());
            }
            else if (response.getState() === 'ERROR') {
                console.log('Error: ', response.getError());
                component.set('v.error', response.getError()[0].message);
            }
        });

        $A.enqueueAction(action);
    },

    setupFilterFields: function(component, event, helper, filterSetData) {
        console.log('Return Value: ', filterSetData);

        for (var i = 0; i < filterSetData.length; i++) {
            filterSetData[i].filterValueMin = '';
            filterSetData[i].filterValueMax = '';
            filterSetData[i].filterValue = '';
        }

        console.log('filterSetData: ', filterSetData);
        component.set('v.filterFieldSet', filterSetData);
    },

    query: function(component, event, helper, instaSearch) {
        if (instaSearch == false && helper.checkForNoCriteria(component, event, helper)) {
            helper.showToast('warning', '', 'Please first enter some search criteria');
        }
        else {
            var filterFieldSet = component.get('v.filterFieldSet');
            var filterFieldSetJSON = JSON.stringify(filterFieldSet);
            console.log('filterFieldSetJSON: ', filterFieldSetJSON);
            var sortOrder = component.get('v.sortOrder') + ' ' + component.get('v.sortDirection');;
            console.log('sortOrder', sortOrder);
            var action = component.get('c.queryApxc');

            action.setParams({
                objectAPIName: component.get('v.objectType'),
                filterFieldSetJSON: filterFieldSetJSON,
                fieldViewSetName: component.get('v.viewSet'),
                orderBy: sortOrder
            });

            action.setCallback(this, function(response) {
                if (response.getState() === 'SUCCESS') {
                    console.log('Success!');
                    var responseValue = response.getReturnValue();
                    component.set('v.viewData', responseValue);

                    if (responseValue.viewData.length < 1) {
                        if (!instaSearch) helper.showToast('warning', '', 'There were no items that matched your criteria.');
                    }
                    else {
                        console.log('Response Value: ', responseValue);

                        var saveEvent = component.getEvent("searchComplete");
                        saveEvent.setParam("data", responseValue.viewData);
                        saveEvent.setParam("objectType", component.get('v.objectType'));
                        saveEvent.fire();
                    }
                }
                else {
                    helper.showToast('warning', '', 'There was an internal error with the search.\r\n' + response.getError()[0].message);
                    console.log('There was an error with the filter: ', response);
                }
            });

            $A.enqueueAction(action);
        }
    },

    showToast: function(type, title, message) {
        var toastEvent = $A.get('e.force:showToast');
        toastEvent.setParams({
            'type': type,
            'title': title,
            'message': message
        });
        toastEvent.fire();
    },

    checkForNoCriteria: function(component, event, helper) {
        var filterFieldSet = component.get('v.filterFieldSet');
        var isEmpty = true;
        for (var i = 0; i < filterFieldSet.length; i++) {
            if (filterFieldSet[i].filterValueMin != '' || filterFieldSet[i].filterValueMax != '' || filterFieldSet[i].filterValue != '') {
                isEmpty = false;
            }
        }

        return isEmpty;
    },
})