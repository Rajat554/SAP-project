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

    // ── Analytics read-only view — no draft, pure aggregation ──
    @readonly
    entity ServiceAnalyticsSet as select from WashWizard.ServiceTask {
        key ID,
        ServiceDate,
        ServiceType,
        Amount,
        PaymentMethod,
        Status,
        HandledBy,
        CustomerName
    };
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

annotate WashWizardService.ServiceAnalyticsSet with @(restrict: [
    { grant: 'READ', to: ['Admin', 'Staff'] }
]);

// ── Property-level analytics annotations (separate annotate block for correct OData compilation) ──
annotate WashWizardService.ServiceAnalyticsSet with {
    ServiceDate   @Analytics.Dimension: true;
    ServiceType   @Analytics.Dimension: true;
    Amount        @Analytics.Measure  : true  @Aggregation.Default: #SUM;
    PaymentMethod @Analytics.Dimension: true;
    Status        @Analytics.Dimension: true;
    HandledBy     @Analytics.Dimension: true;
    CustomerName  @Analytics.Dimension: true;
};

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

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS ANNOTATIONS — ServiceTaskSet
// ═══════════════════════════════════════════════════════════════

// Declare custom aggregates (required by OData V4 charts/KPIs)
annotate WashWizardService.ServiceTaskSet with
    @Aggregation.CustomAggregate#Amount           : 'Edm.Decimal'
    @Aggregation.CustomAggregate#ServiceCount     : 'Edm.Int32'
    @Aggregation.CustomAggregate#AvgAmount        : 'Edm.Decimal'
    @Aggregation.CustomAggregate#AvgDailyAmount   : 'Edm.Decimal';

// Set up default aggregation behaviors and property analytics roles
annotate WashWizardService.ServiceTaskSet with {
    ServiceDate     @Analytics.Dimension: true;
    ServiceType     @Analytics.Dimension: true;
    PaymentMethod   @Analytics.Dimension: true;
    Status          @Analytics.Dimension: true;
    HandledBy       @Analytics.Dimension: true;
    CustomerName    @Analytics.Dimension: true;
    CarModel        @Analytics.Dimension: true;
    VehiclePlate    @Analytics.Dimension: true;
    CompletedAt     @Analytics.Dimension: true;
    Amount          @Analytics.Measure  : true @Aggregation.default: #SUM;
    ServiceCount    @Analytics.Measure  : true @Aggregation.default: #SUM;
    AvgAmount       @Analytics.Measure  : true @Aggregation.default: #AVERAGE;
    AvgDailyAmount  @Analytics.Measure  : true @Aggregation.default: #AVERAGE;
};

// Enable aggregation transformations on the entity set
annotate WashWizardService.ServiceTaskSet with @Aggregation.ApplySupported: {
    Transformations        : [
        'aggregate', 'topcount', 'bottomcount',
        'identity', 'concat', 'groupby', 'filter'
    ],
    GroupableProperties     : [
        Status, ServiceType, PaymentMethod,
        ServiceDate, CarModel, HandledBy,
        CustomerName, VehiclePlate, CompletedAt
    ],
    AggregatableProperties : [
        {
            Property                    : Amount,
            SupportedAggregationMethods : ['sum', 'min', 'max', 'average']
        },
        {
            Property                    : ServiceCount,
            SupportedAggregationMethods : ['sum']
        },
        {
            Property                    : AvgAmount,
            SupportedAggregationMethods : ['average']
        },
        {
            Property                    : AvgDailyAmount,
            SupportedAggregationMethods : ['average']
        }
    ]
};

// ===============================================================
//  KEY PERFORMANCE INDICATORS (KPIs)
// ===============================================================

annotate WashWizardService.ServiceTaskSet with @(
    // -- 1. Total Revenue KPI Card ----------------------------
    UI.KPI #TotalRevenue: {
        ID               : 'KPI_TotalRevenue',
        DataPoint        : ![@UI.DataPoint#TotalRevenueValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPITotalRevenue]
        }
    },

    // -- 2. Total Services KPI Card ---------------------------
    UI.KPI #TotalServices: {
        ID               : 'KPI_TotalServices',
        DataPoint        : ![@UI.DataPoint#TotalServicesValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPITotalServices]
        }
    },

    // -- 3. Avg Daily Revenue KPI Card ------------------------
    UI.KPI #AvgDailyRevenue: {
        ID               : 'KPI_AvgDailyRevenue',
        DataPoint        : ![@UI.DataPoint#AvgDailyRevenueValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPIAvgDailyRevenue]
        }
    },

    // -- 4. Avg Service Value KPI Card ------------------------
    UI.KPI #AvgServiceValue: {
        ID               : 'KPI_AvgServiceValue',
        DataPoint        : ![@UI.DataPoint#AvgServiceValueValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPIAvgServiceValue]
        }
    }
);

// -- Selection/Presentation Variants for KPIs ------------------
annotate WashWizardService.ServiceTaskSet with @(
    UI.SelectionVariant#AllData: {
        SelectOptions: []
    },
    UI.PresentationVariant#KPITotalRevenue: {
        Visualizations: ['@UI.DataPoint#TotalRevenueValue']
    },
    UI.PresentationVariant#KPITotalServices: {
        Visualizations: ['@UI.DataPoint#TotalServicesValue']
    },
    UI.PresentationVariant#KPIAvgDailyRevenue: {
        Visualizations: ['@UI.DataPoint#AvgDailyRevenueValue']
    },
    UI.PresentationVariant#KPIAvgServiceValue: {
        Visualizations: ['@UI.DataPoint#AvgServiceValueValue']
    }
);

// -- DataPoint Configurations for KPIs ------------------------
annotate WashWizardService.ServiceTaskSet with @(
    UI.DataPoint #TotalRevenueValue: {
        Value       : Amount,
        Title       : 'Total Revenue',
        Description : 'This month''s total',
        ValueFormat : { NumberOfFractionalDigits: 2 }
    },
    UI.DataPoint #TotalServicesValue: {
        Value       : ServiceCount,
        Title       : 'Total Services',
        Description : 'Services completed',
        ValueFormat : { NumberOfFractionalDigits: 0 }
    },
    UI.DataPoint #AvgDailyRevenueValue: {
        Value       : AvgDailyAmount,
        Title       : 'Avg Daily Revenue',
        Description : 'Per working day',
        ValueFormat : { NumberOfFractionalDigits: 2 }
    },
    UI.DataPoint #AvgServiceValueValue: {
        Value       : AvgAmount,
        Title       : 'Avg Service Value',
        Description : 'Revenue per service',
        ValueFormat : { NumberOfFractionalDigits: 2 }
    }
);

// ===============================================================
//  ANALYTICS CHARTS
// ===============================================================

annotate WashWizardService.ServiceTaskSet with @(
    // -- 1. Daily Revenue Overview (Line Chart) --------------
    UI.Chart#RevenueTrend: {
        $Type            : 'UI.ChartDefinitionType',
        ChartType        : #Line,
        Title            : 'Daily Revenue Overview',
        Description      : 'Revenue breakdown for selected month',
        Dimensions       : [ServiceDate],
        Measures         : [Amount],
        DimensionAttributes: [{
            Dimension: ServiceDate,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure: Amount,
            Role   : #Axis1
        }]
    },

    // -- 2. Services Count Trend (Column Chart) --------------
    UI.Chart#ServiceCountTrend: {
        $Type            : 'UI.ChartDefinitionType',
        ChartType        : #Column,
        Title            : 'Services Count Trend',
        Description      : 'Daily service count for selected month',
        Dimensions       : [ServiceDate],
        Measures         : [ServiceCount],
        DimensionAttributes: [{
            Dimension: ServiceDate,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure: ServiceCount,
            Role   : #Axis1
        }]
    },

    // -- 3. Service Type Distribution (Donut Chart) ----------
    UI.Chart#ServiceDistributionDonut: {
        $Type            : 'UI.ChartDefinitionType',
        ChartType        : #Donut,
        Title            : 'Service Type Distribution',
        Description      : 'Revenue breakdown by service type',
        Dimensions       : [ServiceType],
        Measures         : [Amount],
        DimensionAttributes: [{
            Dimension: ServiceType,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure: Amount,
            Role   : #Axis1
        }]
    },

    // -- 4. Service Volume by Type (Column Chart) ------------
    UI.Chart#ServiceVolumeByType: {
        $Type            : 'UI.ChartDefinitionType',
        ChartType        : #Column,
        Title            : 'Service Volume by Type',
        Description      : 'Number of services by type',
        Dimensions       : [ServiceType],
        Measures         : [ServiceCount],
        DimensionAttributes: [{
            Dimension: ServiceType,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure: ServiceCount,
            Role   : #Axis1
        }]
    },

    // -- 5. Revenue by Staff Member (Bar Chart) ---------------
    UI.Chart#StaffRevenue: {
        $Type            : 'UI.ChartDefinitionType',
        ChartType        : #Bar,
        Title            : 'Revenue by Staff Member',
        Description      : 'Staff-wise revenue contribution',
        Dimensions       : [HandledBy],
        Measures         : [Amount],
        DimensionAttributes: [{
            Dimension: HandledBy,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure: Amount,
            Role   : #Axis1
        }]
    },

    // -- 6. Services by Staff Member (Column Chart) -----------
    UI.Chart#StaffVolume: {
        $Type            : 'UI.ChartDefinitionType',
        ChartType        : #Column,
        Title            : 'Services by Staff Member',
        Description      : 'Staff-wise service volume',
        Dimensions       : [HandledBy],
        Measures         : [ServiceCount],
        DimensionAttributes: [{
            Dimension: HandledBy,
            Role     : #Category
        }],
        MeasureAttributes: [{
            Measure: ServiceCount,
            Role   : #Axis1
        }]
    }
);

// ===============================================================
//  ANALYTICS VIEW TABS - SelectionPresentationVariants
// ===============================================================

annotate WashWizardService.ServiceTaskSet with @(
    // -- Tab 1: Revenue Trends ---------------------------------
    UI.SelectionPresentationVariant#RevenueTrends: {
        Text              : 'Daily Overview',
        SelectionVariant  : {
            SelectOptions : []
        },
        PresentationVariant: {
            SortOrder      : [{ Property: ServiceDate, Descending: true }],
            Visualizations : ['@UI.Chart#RevenueTrend', '@UI.Chart#ServiceCountTrend', '@UI.LineItem']
        }
    },

    // -- Tab 2: Service Distribution --------------------------
    UI.SelectionPresentationVariant#ServiceDistribution: {
        Text              : 'Service Type Distribution',
        SelectionVariant  : {
            SelectOptions : []
        },
        PresentationVariant: {
            Visualizations : ['@UI.Chart#ServiceDistributionDonut', '@UI.Chart#ServiceVolumeByType', '@UI.LineItem']
        }
    },

    // -- Tab 3: Performance ------------------------------------
    UI.SelectionPresentationVariant#Performance: {
        Text              : 'Revenue by Staff Member',
        SelectionVariant  : {
            SelectOptions : []
        },
        PresentationVariant: {
            Visualizations : ['@UI.Chart#StaffRevenue', '@UI.Chart#StaffVolume', '@UI.LineItem']
        }
    }
);
