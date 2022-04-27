({
    doInit: function(component, event, helper) {
        helper.getFilterFields(component, event, helper);
    },
    instaSearch: function(component, event, helper) {
        if (component.get('v.instaSearch')) {
            helper.query(component, event, helper, true);
        }
    },
    search: function(component, event, helper) {
        helper.query(component, event, helper, false);
    },
})