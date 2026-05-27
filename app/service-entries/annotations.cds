using WashWizardService as service from '../../srv/service';

// App-specific annotation overrides for the service-entries List Report
// (The main annotations are in srv/service.cds)

annotate service.ServiceTaskSet with @(
    Common.SideEffects #ReactOnServiceTypeChange: {
        SourceProperties : [ServiceType],
        TargetProperties : ['Amount']
    }
);
