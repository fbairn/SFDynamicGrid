public class DynoGridController {
    @AuraEnabled
    public static DataTableResponse getRecords(String recordId, String childObject, String strFieldSetName){ 
        if(String.isEmpty(recordId)) throw new AuraHandledException('recordId is missing');
        if(String.isEmpty(childObject)) throw new AuraHandledException('childObject is missing');
        if(String.isEmpty(strFieldSetName)) throw new AuraHandledException('strFieldSetName is missing');
        return getRecordset(recordId, childObject, strFieldSetName);
    }
    
    
    private static DataTableResponse getRecordset(Id parentId, String strObjectName, String strFieldSetName){                
       	String parentObject = ((Id)parentId).getSObjectType().getDescribe().getName();
       	
        //Get the fields from FieldSet
        Schema.SObjectType SObjectTypeObj = Schema.getGlobalDescribe().get(strObjectName);
        Schema.DescribeSObjectResult DescribeSObjectResultObj = SObjectTypeObj.getDescribe();            
        Schema.FieldSet fieldSetObj = DescribeSObjectResultObj.FieldSets.getMap().get(strFieldSetName);
        if(fieldSetObj==null) throw new AuraHandledException('Fieldset was not found');
        //To hold the table hearders 
        List<DataTableColumns> lstDataColumns = new List<DataTableColumns>();
        
        //Field to be queried - fetched from fieldset
        List<String> lstFieldsToQuery = new List<String>();
        
        //The final wrapper response to return to component
        DataTableResponse response = new DataTableResponse();
        
        for( Schema.FieldSetMember eachFieldSetMember : fieldSetObj.getFields() ){
            String dataType = String.valueOf(eachFieldSetMember.getType()).toLowerCase();
            //Create a wrapper instance and store label, fieldname and type.
            Schema.DescribeFieldResult describeField = DescribeSObjectResultObj.fields.getMap().get(eachFieldSetMember.getFieldPath()).getDescribe();
            Boolean editable = describeField.isUpdateable();
            
            DataTableColumns datacolumns = new DataTableColumns( String.valueOf(eachFieldSetMember.getLabel()) , 
                                                                String.valueOf(eachFieldSetMember.getFieldPath()), 
                                                                String.valueOf(eachFieldSetMember.getType()).toLowerCase(),
                                                                editable);
			lstDataColumns.add(datacolumns);
            lstFieldsToQuery.add(String.valueOf(eachFieldSetMember.getFieldPath()));
        }
        
        //Form an SOQL to fetch the data - Set the wrapper instance and return as response
        if(! lstDataColumns.isEmpty()){            
            response.lstDataTableColumns = lstDataColumns;
            String query = 'SELECT Id, (SELECT ID, ' + String.join(lstFieldsToQuery, ',') + ' FROM ' + strObjectName + 's) FROM ' + parentObject + ' WHERE Id=:parentId';
            System.debug(query);
            sObject parent = Database.query(query);
            response.lstDataTableData = parent.getSObjects(strObjectName + 's');
        }
        
        return response;
    }
    
    @AuraEnabled
    public static boolean updateRecords(String parentId, String parentField, String strObjectName, String editedRecordJSON){
        if(editedRecordJSON==null) throw new AuraHandledException('editedRecordList was not passed as a parameter');
        if(strObjectName==null) throw new AuraHandledException('strObjectName was not passed as a parameter');
        
        editedRecordJSON = editedRecordJSON.replaceAll('"Id":"row-[0-9]"','"Id":null');
        System.debug('ER:' + editedRecordJSON);
        Type customType = Type.forName('List<' + strObjectName + '>');

        List<sObject> editedRecordList = (List<sObject>)JSON.deserialize(editedRecordJSON, customType);
        System.debug(editedRecordList);
          for(sObject rec: editedRecordList){
            if(rec.id==null){
                rec.put(parentField, parentId);
            }
        }
        //try{
            upsert editedRecordList;
            return true;
        //} catch(Exception e){
        //    return false;
        //}
    }
    
    public class DataTableColumns {
        @AuraEnabled
        public String label {get;set;}
        @AuraEnabled       
        public String fieldName {get;set;}
        @AuraEnabled
        public String type {get;set;}
        @AuraEnabled
        public Boolean editable;
        @AuraEnabled
        public Boolean sortable=true;
        @AuraEnabled
        public List<HeaderAction> actions = new List<HeaderAction>();
        
        //Create and set three variables label, fieldname and type as required by the lightning:datatable
        public DataTableColumns(String label, String fieldName, String type, Boolean editable){
            this.label = label;
            this.fieldName = fieldName;
            this.type = dataTypeTranslate(type); 
            this.editable = editable;
            actions.add(new HeaderAction('Filter', false, 'filter-' + fieldName));
            
            
        }
        
        private string dataTypeTranslate(String type){
            switch on type {
                when 'datetime' {
                    return 'date';
                }
                when else {
                    return type;
                }
            }
        }
    }
    
    public class HeaderAction{
        @AuraEnabled
        public String label;
        @AuraEnabled
        public Boolean checked;
        @AuraEnabled
        public String name;
        
        public HeaderAction(String label, Boolean checked, String name){
            this.label = label;
            this.checked = checked;
            this.name = name;
        }
    }
    
    public class DataTableResponse {
        @AuraEnabled
        public List<DataTableColumns> lstDataTableColumns {get;set;}
        @AuraEnabled
        public List<sObject> lstDataTableData {get;set;}                
        
        public DataTableResponse(){
            lstDataTableColumns = new List<DataTableColumns>();
            lstDataTableData = new List<sObject>();
        }
    }
}