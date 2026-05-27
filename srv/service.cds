using WashWizard from '../db/schema';

// ═══════════════════════════════════════════════════════════════
//  SERVICE DEFINITION
// ═══════════════════════════════════════════════════════════════

service WashWizardService @(requires: 'authenticated-user') {

    @odata.draft.enabled
    entity ServiceTaskSet as projection on WashWizard.ServiceTask {
        *,
        1 as ServiceCount : Integer,
        Amount as AvgAmount : Decimal(10,2),
        Amount as AvgDailyAmount : Decimal(10,2)
    } actions {
        @cds.odata.bindingparameter.name: '_self'
        action completeService() returns ServiceTaskSet;
    };

    entity UsersSet @(requires: 'Admin') as projection on WashWizard.Users;

    @odata.draft.enabled
    entity CarModelMasterSet as projection on WashWizard.CarModelMaster;

    @odata.draft.enabled
    entity ServiceCatalogSet as projection on WashWizard.ServiceCatalog;
}

// ═══════════════════════════════════════════════════════════════
//  RBAC RESTRICTIONS
// ═══════════════════════════════════════════════════════════════

annotate WashWizardService.ServiceTaskSet with @(restrict: [
    { grant: '*', to: 'Admin' },
    { grant: ['READ', 'CREATE', 'UPDATE'], to: 'Staff' }
]);

annotate WashWizardService.CarModelMasterSet with @(restrict: [
    { grant: '*', to: 'Admin' },
    { grant: 'READ', to: 'Staff' }
]);

annotate WashWizardService.ServiceCatalogSet with @(restrict: [
    { grant: '*', to: 'Admin' },
    { grant: 'READ', to: 'Staff' }
]);

// ═══════════════════════════════════════════════════════════════
//  VALUE-HELP ANNOTATIONS
// ═══════════════════════════════════════════════════════════════

annotate WashWizardService.ServiceTaskSet with {
    PaymentMethod @Common.ValueListWithFixedValues;
    Status        @Common.ValueListWithFixedValues;
};

annotate WashWizardService.ServiceTaskSet with {
    PaymentMethod @Common.ValueList: {
        CollectionPath: 'ServiceTaskSet',
        Parameters: [
            { $Type: 'Common.ValueListParameterOut', LocalDataProperty: PaymentMethod, ValueListProperty: 'PaymentMethod' }
        ]
    }
};

annotate WashWizardService.ServiceTaskSet with {
    CarModel @Common.ValueList: {
        CollectionPath: 'CarModelMasterSet',
        Parameters: [
            { $Type: 'Common.ValueListParameterOut',     LocalDataProperty: CarModel, ValueListProperty: 'ModelName' },
            { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Brand' }
        ]
    }
};

annotate WashWizardService.ServiceTaskSet with {
    ServiceType @Common.ValueList: {
        CollectionPath: 'ServiceCatalogSet',
        Parameters: [
            { $Type: 'Common.ValueListParameterOut',     LocalDataProperty: ServiceType, ValueListProperty: 'ServiceName' },
            { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Category' },
            { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Price' }
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
//  UI ANNOTATIONS — ServiceTaskSet (List Report + Object Page)
// ═══════════════════════════════════════════════════════════════

annotate WashWizardService.ServiceTaskSet with @(

    // ── Header Info (Object Page title bar) ──────────────────
    UI.HeaderInfo: {
        TypeName      : 'Service Entry',
        TypeNamePlural: 'Service Entries',
        Title         : { $Type: 'UI.DataField', Value: CustomerName },
        Description   : { $Type: 'UI.DataField', Value: VehiclePlate }
    },

    // ── Filter Bar Fields ────────────────────────────────────
    UI.SelectionFields: [
        Status,
        PaymentMethod,
        ServiceDate,
        CustomerName
    ],

    // ── Table Columns (List Report) ──────────────────────────
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: CustomerName, Label: 'Customer',       ![@UI.Importance]: #High },
        { $Type: 'UI.DataField', Value: Phone,        Label: 'Phone' },
        { $Type: 'UI.DataField', Value: CarModel,     Label: 'Car Model' },
        { $Type: 'UI.DataField', Value: VehiclePlate, Label: 'Vehicle Plate',  ![@UI.Importance]: #High },
        { $Type: 'UI.DataField', Value: ServiceType,  Label: 'Services' },
        { $Type: 'UI.DataField', Value: Amount,       Label: 'Amount (₹)',     ![@UI.Importance]: #High },
        { $Type: 'UI.DataField', Value: PaymentMethod, Label: 'Payment' },
        {
            $Type: 'UI.DataField',
            Value: Status,
            Label: 'Status',
            Criticality: {$edmJson: {$If: [
                {$Eq: [{$Path: 'Status'}, 'Completed']}, 3,
                {$If: [{$Eq: [{$Path: 'Status'}, 'Pending']}, 2, 0]}
            ]}},
            ![@UI.Importance]: #High
        },
        { $Type: 'UI.DataField', Value: ServiceDate,  Label: 'Date' },
        { $Type: 'UI.DataField', Value: CompletedAt,  Label: 'Completed On' },
        { $Type: 'UI.DataField', Value: HandledBy,    Label: 'Handled By' }
    ],

    // ── Object Page: Header Facets ───────────────────────────
    UI.HeaderFacets: [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.DataPoint#Status'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.DataPoint#Amount'
        }
    ],

    // ── Object Page: Section Facets ──────────────────────────
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ContactFacet',
            Label : 'Contact Details',
            Target: '@UI.FieldGroup#Contact'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'VehicleFacet',
            Label : 'Vehicle Details',
            Target: '@UI.FieldGroup#Vehicle'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ServiceFacet',
            Label : 'Service & Payment',
            Target: '@UI.FieldGroup#Service'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'LifecycleFacet',
            Label : 'Lifecycle',
            Target: '@UI.FieldGroup#Lifecycle'
        }
    ],

    // ── Field Groups (Object Page sections) ──────────────────
    UI.FieldGroup#Contact: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: CustomerName, Label: 'Customer Name' },
            { $Type: 'UI.DataField', Value: Phone,        Label: 'Phone Number' }
        ]
    },
    UI.FieldGroup#Vehicle: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: CarModel,     Label: 'Car Model' },
            { $Type: 'UI.DataField', Value: VehiclePlate, Label: 'Vehicle Plate' }
        ]
    },
    UI.FieldGroup#Service: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: ServiceType,    Label: 'Service Type' },
            { $Type: 'UI.DataField', Value: Amount,          Label: 'Amount (₹)' },
            { $Type: 'UI.DataField', Value: PaymentMethod,   Label: 'Payment Method' }
        ]
    },
    UI.FieldGroup#Lifecycle: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: Status,       Label: 'Status' },
            { $Type: 'UI.DataField', Value: ServiceDate,   Label: 'Service Date' },
            { $Type: 'UI.DataField', Value: CompletedAt,   Label: 'Completed At' },
            { $Type: 'UI.DataField', Value: HandledBy,     Label: 'Handled By' }
        ]
    },

    // ── Data Points ──────────────────────────────────────────
    UI.DataPoint#Status: {
        Value: Status,
        Title: 'Status',
        Criticality: {$edmJson: {$If: [
            {$Eq: [{$Path: 'Status'}, 'Completed']}, 3,
            {$If: [{$Eq: [{$Path: 'Status'}, 'Pending']}, 2, 0]}
        ]}}
    },
    UI.DataPoint#Amount: {
        Value: Amount,
        Title: 'Amount (₹)'
    },

    // ── Selection Variants (preset filters) ──────────────────
    UI.SelectionVariant#All: {
        Text         : 'All Services',
        SelectOptions: []
    },
    UI.SelectionVariant#Pending: {
        Text         : 'Pending Services',
        SelectOptions: [{
            PropertyName: Status,
            Ranges      : [{ Sign: #I, Option: #EQ, Low: 'Pending' }]
        }]
    },
    UI.SelectionVariant#Completed: {
        Text         : 'Completed Services',
        SelectOptions: [{
            PropertyName: Status,
            Ranges      : [{ Sign: #I, Option: #EQ, Low: 'Completed' }]
        }]
    },

    // ── Presentation Variants ────────────────────────────────
    UI.PresentationVariant#Default: {
        Text          : 'Default',
        SortOrder     : [{ Property: ServiceDate, Descending: true }],
        Visualizations: ['@UI.LineItem']
    },

    // ── Charts ───────────────────────────────────────────────
    UI.Chart#RevenueByDate: {
        $Type           : 'UI.ChartDefinitionType',
        ChartType       : #Line,
        Title           : 'Daily Revenue Trend',
        Dimensions      : [ServiceDate],
        Measures        : [Amount],
        DimensionAttributes: [{
            Dimension: ServiceDate,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure : Amount,
            Role    : #Axis1
        }]
    },
    UI.Chart#ServiceDistribution: {
        $Type           : 'UI.ChartDefinitionType',
        ChartType       : #Donut,
        Title           : 'Revenue by Service Type',
        Dimensions      : [ServiceType],
        Measures        : [Amount],
        DimensionAttributes: [{
            Dimension: ServiceType,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure : Amount,
            Role    : #Axis1
        }]
    },
    UI.Chart#PaymentBreakdown: {
        $Type           : 'UI.ChartDefinitionType',
        ChartType       : #Bar,
        Title           : 'Revenue by Payment Method',
        Dimensions      : [PaymentMethod],
        Measures        : [Amount],
        DimensionAttributes: [{
            Dimension: PaymentMethod,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure : Amount,
            Role    : #Axis1
        }]
    },
    UI.Chart#StatusOverview: {
        $Type           : 'UI.ChartDefinitionType',
        ChartType       : #Column,
        Title           : 'Services by Status',
        Dimensions      : [Status],
        Measures        : [Amount],
        DimensionAttributes: [{
            Dimension: Status,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure : Amount,
            Role    : #Axis1
        }]
    },

    // ── Selection Presentation Variants (for analytics) ──────
    UI.SelectionPresentationVariant#RevenueAnalytics: {
        Text              : 'Revenue Analytics',
        SelectionVariant  : {
            SelectOptions: []
        },
        PresentationVariant: {
            SortOrder     : [{ Property: ServiceDate, Descending: true }],
            Visualizations: ['@UI.LineItem', '@UI.Chart#RevenueByDate']
        }
    },
    UI.SelectionPresentationVariant#ServiceAnalytics: {
        Text              : 'Service Distribution',
        SelectionVariant  : {
            SelectOptions: []
        },
        PresentationVariant: {
            Visualizations: ['@UI.LineItem', '@UI.Chart#ServiceDistribution']
        }
    },
    UI.SelectionPresentationVariant#PaymentAnalytics: {
        Text              : 'Payment Analysis',
        SelectionVariant  : {
            SelectOptions: []
        },
        PresentationVariant: {
            Visualizations: ['@UI.LineItem', '@UI.Chart#PaymentBreakdown']
        }
    },
    UI.SelectionPresentationVariant#PendingView: {
        Text              : 'Pending Services',
        SelectionVariant  : {
            SelectOptions: [{
                PropertyName: Status,
                Ranges      : [{ Sign: #I, Option: #EQ, Low: 'Pending' }]
            }]
        },
        PresentationVariant: {
            SortOrder     : [{ Property: ServiceDate, Descending: true }],
            Visualizations: ['@UI.LineItem']
        }
    },
    UI.SelectionPresentationVariant#CompletedView: {
        Text              : 'Completed Services',
        SelectionVariant  : {
            SelectOptions: [{
                PropertyName: Status,
                Ranges      : [{ Sign: #I, Option: #EQ, Low: 'Completed' }]
            }]
        },
        PresentationVariant: {
            SortOrder     : [{ Property: CompletedAt, Descending: true }],
            Visualizations: ['@UI.LineItem']
        }
    }
);

// ═══════════════════════════════════════════════════════════════
//  UI ANNOTATIONS — UsersSet
// ═══════════════════════════════════════════════════════════════

annotate WashWizardService.UsersSet with @(
    UI.HeaderInfo: {
        TypeName      : 'User',
        TypeNamePlural: 'Users',
        Title         : { $Type: 'UI.DataField', Value: Username }
    },
    UI.SelectionFields: [ Role ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: Username, Label: 'Username', ![@UI.Importance]: #High },
        {
            $Type: 'UI.DataField',
            Value: Role,
            Label: 'Role',
            Criticality: {$edmJson: {$If: [
                {$Eq: [{$Path: 'Role'}, 'Admin']}, 1, 3
            ]}},
            ![@UI.Importance]: #High
        }
    ],
    UI.Facets: [{
        $Type : 'UI.ReferenceFacet',
        Label : 'User Details',
        Target: '@UI.FieldGroup#UserInfo'
    }],
    UI.FieldGroup#UserInfo: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: Username, Label: 'Username' },
            { $Type: 'UI.DataField', Value: Role,     Label: 'Role' }
        ]
    }
);

// ═══════════════════════════════════════════════════════════════
//  UI ANNOTATIONS — ServiceCatalogSet
// ═══════════════════════════════════════════════════════════════

annotate WashWizardService.ServiceCatalogSet with @(
    UI.HeaderInfo: {
        TypeName      : 'Service',
        TypeNamePlural: 'Service Catalog',
        Title         : { $Type: 'UI.DataField', Value: ServiceName },
        Description   : { $Type: 'UI.DataField', Value: Category }
    },
    UI.SelectionFields: [
        Category,
        ServiceName
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: Category,    Label: 'Category',     ![@UI.Importance]: #High },
        { $Type: 'UI.DataField', Value: ServiceName, Label: 'Service Name', ![@UI.Importance]: #High },
        { $Type: 'UI.DataField', Value: Price,       Label: 'Price (₹)',    ![@UI.Importance]: #High }
    ],
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ServiceDetailsFacet',
            Label : 'Service Details',
            Target: '@UI.FieldGroup#ServiceDetails'
        }
    ],
    UI.FieldGroup#ServiceDetails: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: Category,    Label: 'Category' },
            { $Type: 'UI.DataField', Value: ServiceName, Label: 'Service Name' },
            { $Type: 'UI.DataField', Value: Price,       Label: 'Price (₹)' }
        ]
    }
);

annotate WashWizardService.ServiceCatalogSet with {
    Category @Common.ValueListWithFixedValues;
    Category @Common.ValueList: {
        CollectionPath: 'ServiceCatalogSet',
        Parameters: [
            { $Type: 'Common.ValueListParameterOut', LocalDataProperty: Category, ValueListProperty: 'Category' }
        ]
    }
};

// ═══════════════════════════════════════════════════════════════
//  UI ANNOTATIONS — CarModelMasterSet
// ═══════════════════════════════════════════════════════════════

annotate WashWizardService.CarModelMasterSet with @(
    UI.HeaderInfo: {
        TypeName      : 'Car Model',
        TypeNamePlural: 'Car Models',
        Title         : { $Type: 'UI.DataField', Value: ModelName },
        Description   : { $Type: 'UI.DataField', Value: Brand }
    },
    UI.SelectionFields: [
        Brand,
        ModelName
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: Brand,     Label: 'Brand',      ![@UI.Importance]: #High },
        { $Type: 'UI.DataField', Value: ModelName, Label: 'Model Name', ![@UI.Importance]: #High }
    ],
    UI.Facets: [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'CarModelDetailsFacet',
            Label : 'Car Model Details',
            Target: '@UI.FieldGroup#CarModelDetails'
        }
    ],
    UI.FieldGroup#CarModelDetails: {
        $Type: 'UI.FieldGroupType',
        Data : [
            { $Type: 'UI.DataField', Value: Brand,     Label: 'Brand' },
            { $Type: 'UI.DataField', Value: ModelName, Label: 'Model Name' }
        ]
    }
);
