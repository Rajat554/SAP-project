using WashWizard from '../db/schema';

service WashWizardService @(requires: 'authenticated-user') {
    entity ServiceTaskSet @(restrict: [
        { grant: ['READ', 'CREATE', 'UPDATE'], to: 'authenticated-user' },
        { grant: ['DELETE'], to: 'Admin' }
    ]) as projection on WashWizard.ServiceTask;

    entity UsersSet @(requires: 'Admin') as projection on WashWizard.Users;
}
