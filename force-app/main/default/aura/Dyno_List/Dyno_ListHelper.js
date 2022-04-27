({
    getColumns: function(component, event, helper) {
        var action = component.get('c.getFieldSetApxc');

        action.setParams({
            fieldSetName: component.get('v.fieldSet'),
            objectAPIName: component.get('v.objectType')
        });

        action.setCallback(this, function(response) {
            console.log('Filter callback: ', response)
            if (response.getState() === 'SUCCESS') {
                component.set('v.viewColumns', response.getReturnValue());
            }
            else if (response.getState() === 'ERROR') {
                console.log('Error: ', response.getError());
                alert(response.getError()[0].message);
            }
        });

        $A.enqueueAction(action);
    },
    
    generateTable: function(component, event, helper) {
        //Empty out the dynamic table
        var dynamicTableContainer = component.find('dynamic-table');
        if (dynamicTableContainer != undefined) {
            dynamicTableContainer.set('v.body', []);
        }

        var viewColumns = component.get('v.viewColumns');
        var viewData = component.get('v.viewData');
        console.log('Generate Table: ', component, viewData);

        for (var i = 0; i < viewData.length; i++) {

            var item = viewData[i];
            console.log("ViewData: ", item);
            $A.createComponents(
                [
                    ['tr', {
                        'aura:id': item.Id
                    }],
                    ['td', {
                        'data-label': 'checktd'
                    }],
                    ['ui:inputCheckbox', {
                        'value': component.getReference("v.viewData[" + i + "].checked"),
                        'click': component.getReference("c.selectItem"),
                        'type': 'checkbox',
                        'text': item.Id
                    }]
                ],
                function(row, status, errorMessage) {
                    console.log('TR Created: ', row);
                    if (status === 'SUCCESS') {
                        var tableContainer = component.find('dynamic-table');
                        var tableBody = tableContainer.get('v.body');
                        var rowArray = [];

                        var box = row[2];
                        var boxtd = row[1];

                        // divA.set('v.body', 'text');
                        // console.log('40', divA);

                        boxtd.set('v.body', box);
                        // console.log('40', tdA);
                        if (component.get('v.showSelectBoxes')) {
                            rowArray.push(boxtd);
                        }

                        for (var x = 0; x < viewColumns.length; x++) {
                            console.log('X',x,viewColumns[x]);
                            var value = item[viewColumns[x].APIName];
                            if (value == undefined) {
                                value = '-';
                            }
                            var output = ['ui:outputText', {
                                'value': value
                            }];

                            // if (x === 0) output = ['ui:outputURL', {
                            // 	'label': value,
                            // 	'data-is': i
                            // }];

                            $A.createComponents(
                                [
                                    ['td', {
                                        'data-label': value,
                                    }],
                                    ['div', {
                                        'class': 'slds-truncate',
                                        'title': value,
                                        'data-is': i,
                                        'onclick': component.getReference("c.showItemModal"),
                                    }],
                                    output
                                ],
                                function(components, status, errorMessage) {
                                    if (status === 'SUCCESS') {
                                        var td = components[0];
                                        var div = components[1];
                                        var text = components[2];

                                        div.set('v.body', text);
                                        td.set('v.body', div);

                                        rowArray.push(td);

                                    }
                                    else if (status === 'INCOMPLETE') {
                                        console.log('No response from server or client is offline.');
                                    }
                                    else if (status === 'ERROR') {
                                        console.log('Error: ' + errorMessage);
                                    }
                                }
                            );

                        }
                        row[0].set('v.body', rowArray);
                        tableBody.push(row[0]);
                        tableContainer.set('v.body', tableBody);
                    }

                    else if (status === 'INCOMPLETE') {
                        console.log('No response from server or client is offline.');
                    }
                    else if (status === 'ERROR') {
                        console.log('Error: ' + errorMessage);
                        throw new Error('An error occured proccesing the request. Please refresh the page and try again.')
                    }
                }
            );
        }
    }
})