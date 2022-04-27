@IsTest
public class DynoGridControllerTest {
    @IsTest
    public static void getRecordsTest(){
        Account acnt=new Account(Name='test');
        insert acnt;
        
        Contact contct=new Contact(LastName='Joe', AccountId=acnt.id);
        insert contct;
        
        Test.startTest();
        DynoGridController.DataTableResponse response = DynoGridController.getRecords(acnt.id,'Contact','RList');
        Test.stopTest();
        
        System.debug(response.lstDataTableData);
        System.assertEquals(1, response.lstDataTableData.size());
        System.assertEquals(contct.id, response.lstDataTableData[0].id);
    }
    
    
    @IsTest
    public static void updateRecordsTest(){
        Account acnt=new Account(Name='test');
        insert acnt;
        
        Contact contct=new Contact(LastName='Smith', AccountId=acnt.id);
        insert contct;
        
        contct.FirstName='Joe';
        List<Contact> contactList = new List<Contact>{contct};
        
        Test.startTest();
        Boolean response = DynoGridController.updateRecords(acnt.Id, 'AccountId', 'Contact',JSON.serialize(contactList));
        Test.stopTest();
        
        System.assertEquals(true, response);
        contct=[SELECT Id, FirstName FROM Contact WHERE Id=:contct.id];
        System.assertEquals('Joe', contct.FirstName);
    }
}