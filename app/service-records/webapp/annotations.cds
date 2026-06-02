using WashWizardService as service from '../../../srv/service';

// ── Service Records: dedicated LineItem for the records view ──────────

annotate service.ServiceTaskSet with @(
    UI.PresentationVariant: {
        Text          : 'Default',
        SortOrder     : [{ Property: ServiceDate, Descending: true }],
        Visualizations: ['@UI.LineItem']
    }
);
