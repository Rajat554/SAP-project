using WashWizard from '../db/schema';

service WashWizardService {
    entity ServiceTaskSet as projection on WashWizard.ServiceTask;
}
