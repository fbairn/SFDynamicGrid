public class DynoSearch {
    /**
     * Method to get retrieve all the fields on a field set
     * @param  fieldSetName The string name of the field set
     * @return              List of fields in the field set
    */

    @AuraEnabled
    public static List<OrganizedField> getFieldSetApxc(String objectAPIName, String fieldSetName) {
        Schema.SObjectType objectSchema = Schema.getGlobalDescribe().get(objectAPIName);
        if(objectSchema==null) throw new AuraHandledException('The object ' + objectAPIName + ' could not be found. Did you forget __c?');

        Schema.FieldSet fieldSet = objectSchema.getDescribe().fieldSets.getMap().get(fieldSetName);
        if(fieldSet==null) throw new AuraHandledException('The fieldset ' + fieldSetName + ' could not be found on the object ' + objectAPIName);

        List<Schema.FieldSetMember> listFieldSetMembers = fieldSet.getFields();

        List<OrganizedField> listOfFields = new List<OrganizedField>();

        for (Schema.FieldSetMember field : listFieldSetMembers) {
        listOfFields.add(New OrganizedField(field.getLabel(), field.getFieldPath(), field.getType().Name()));
        }

        return listOfFields;
    }

    /**
     * Method to query the products - it passes in the filter field set values, queries the view field set and queries the products
     * @param  filterFieldSetJSON JSON of the field set and values - is deserialized in the method
     * @return                    ViewData wrapper class - holds the column headers and the data
     */
    @AuraEnabled
    public static ViewData queryApxc(String objectAPIName, String fieldViewSetName, String filterFieldSetJSON, String orderBy) {
        //Deserialize the JSON value into the FilteredField Wrapper Class
        List<FilteredField> filteredFields = (List<FilteredField>)JSON.deserialize(filterFieldSetJSON, List<FilteredField>.class);
        System.debug('filteredFields: ' + filteredFields);

        List<OrganizedField> listOfFields = getFieldSetApxc(objectAPIName,fieldViewSetName);

        String selectString = '';
        for (OrganizedField field : listOfFields) {
            selectString += field.APIName + ',';
        }

        selectString = selectString.removeEnd(',');
        
        if(String.isNotBlank(orderBy)){
            orderBy = 'Order By ' + orderBy;
        } else {
            orderBy = 'Order By ' + listOfFields[0].APIName;
        }

        String whereString = '';
        for (FilteredField filteredField : filteredFields) {
            if (filteredField.displayType == 'range') {
                System.debug('range');

                //If both exist
                if (String.isEmpty(filteredField.filterValueMin) == false && String.isEmpty(filteredField.filterValueMax) == false) {
                    whereString += '(' + filteredField.APIName + ' >= ' + filteredField.filterValueMin + ' AND ' + filteredField.APIName + ' <= ' + filteredField.filterValueMax + ') AND ';
                }
                //If just max exists and min is empty
                if (String.isEmpty(filteredField.FilterValueMin) == true && String.isEmpty(filteredField.filterValueMax) == false) {
                    whereString += '(' + filteredField.APIName + ' <= ' + filteredField.filterValueMax + ') AND ';
                }

                //If just min exists and max is empty
                if (String.isEmpty(filteredField.FilterValueMin) == false && String.isEmpty(filteredField.filterValueMax) == true) {
                    whereString += '(' + filteredField.APIName + ' >= ' + filteredField.filterValueMin + ') AND ';
                }



            } else if (filteredField.displayType == 'string') {
                System.debug('string');

                if (String.isEmpty(filteredField.filterValue) == false) {
                    whereString += '(' + filteredField.APIName + ' LIKE \'' + filteredField.filterValue + '%\') AND ';
                }
            }
        }

        whereString = whereString.removeEnd(' AND ');

        if(String.isNotBlank(whereString)){
            whereString = 'WHERE ' + whereString;
        }

        String queryString = 'SELECT ' + selectString + ' FROM ' + objectAPIName + ' ' + whereString + ' ' + orderBy;
        System.debug('queryString: ' + queryString);
        List<sObject> products = Database.query(queryString);
        System.debug('products: ' + products);

        ViewData viewData = new ViewData(listOfFields, products);

        return viewData;
    }


    /**
     * Wrapper class to organize the field set data
     */
    public class OrganizedField {
        //@AuraEnabled public String fieldSetName {get; set;}
        @AuraEnabled public String Name {get; set;}
        @AuraEnabled public String APIName {get; set;}
        @AuraEnabled public String DisplayType {get; set;}

        public OrganizedField (String NameParam, String APINameParam, String FieldTypeParam) {
            //this.fieldSetName = fieldSetNameParam;
            this.Name = NameParam;
            this.APIName = APINameParam;
            //this.FieldType = FieldTypeParam;
            
            if (FieldTypeParam == 'CURRENCY' || FieldTypeParam == 'DOUBLE' || FieldTypeParam == 'INTEGER') {
                this.DisplayType = 'range';
            }
            else if (FieldTypeParam == 'PICKLIST') {
                this.DisplayType = 'picklist';
            }
            else if (FieldTypeParam == 'BOOLEAN') {
                this.DisplayType = 'checkbox';
            }
            else {
                this.DisplayType = 'string';
            }
        }
    }


    /**
     * Wrapper class to catch the filtered fields coming back from the UI
     */
    public class FilteredField {
        @AuraEnabled public String displayType {get; set;}
        @AuraEnabled public String filterValue {get; set;}
        @AuraEnabled public String filterValueMin {get; set;}
        @AuraEnabled public String filterValueMax {get; set;}
        @AuraEnabled public String APIName {get; set;}
        @AuraEnabled public String Name {get; set;}
        @AuraEnabled public String FieldType {get; set;}

        public FilteredField(String displayTypeParam, String filterValueParam, String filterValueMinParam, String filterValueMaxParam, String APINameParam, String NameParam, String FieldTypeParam) {
            this.displayType = displayTypeParam;
            this.filterValue = filterValueParam;
            this.APIName = APINameParam;
            this.Name = NameParam;
            this.FieldType = displayTypeParam;
            this.filterValueMin = filterValueMinParam;
            this.filterValueMax = filterValueMaxParam;
        }
    }


    /**
     * Wrapper class to organize the fields and their values for the UI
     */
    public class ViewData {
        @AuraEnabled public List<OrganizedField> viewColumns {get; set;}
        @AuraEnabled public List<sObject> viewData {get; set;}

        public ViewData(List<OrganizedField> viewColumnsParam, List<sObject> viewDataParam) {
            this.viewColumns = viewColumnsParam;
            this.viewData = viewDataParam;
        }
    }


}