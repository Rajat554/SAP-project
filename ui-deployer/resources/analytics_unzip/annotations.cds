using WashWizardService as service from '../../../srv/service';

// ═══════════════════════════════════════════════════════════════
//  AGGREGATION SUPPORT — Required for analytical charts/KPIs
// ═══════════════════════════════════════════════════════════════

// Declare custom aggregates (required by OData V4 charts/KPIs)
annotate service.ServiceTaskSet with
    @Aggregation.CustomAggregate#Amount           : 'Edm.Decimal'
    @Aggregation.CustomAggregate#ServiceCount     : 'Edm.Int32'
    @Aggregation.CustomAggregate#AvgAmount        : 'Edm.Decimal'
    @Aggregation.CustomAggregate#AvgDailyAmount   : 'Edm.Decimal';

// Set up default aggregation behaviors at property level
annotate service.ServiceTaskSet with {
    Amount          @Analytics.Measure @Aggregation.default: #SUM;
    ServiceCount    @Analytics.Measure @Aggregation.default: #SUM;
    AvgAmount       @Analytics.Measure @Aggregation.default: #AVERAGE;
    AvgDailyAmount  @Analytics.Measure @Aggregation.default: #AVERAGE;
};

// Enable aggregation transformations on the entity set
annotate service.ServiceTaskSet with @Aggregation.ApplySupported: {
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


// ═══════════════════════════════════════════════════════════════
//  KEY PERFORMANCE INDICATORS (KPIs)
// ═══════════════════════════════════════════════════════════════

annotate service.ServiceTaskSet with @(
    // ── 1. Total Revenue KPI Card ────────────────────────────
    UI.KPI #TotalRevenue: {
        ID               : 'KPI_TotalRevenue',
        DataPoint        : ![@UI.DataPoint#TotalRevenueValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPITotalRevenue]
        }
    },

    // ── 2. Total Services KPI Card ───────────────────────────
    UI.KPI #TotalServices: {
        ID               : 'KPI_TotalServices',
        DataPoint        : ![@UI.DataPoint#TotalServicesValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPITotalServices]
        }
    },

    // ── 3. Avg Daily Revenue KPI Card ────────────────────────
    UI.KPI #AvgDailyRevenue: {
        ID               : 'KPI_AvgDailyRevenue',
        DataPoint        : ![@UI.DataPoint#AvgDailyRevenueValue],
        SelectionVariant : ![@UI.SelectionVariant#AllData],
        Detail : {
            $Type : 'UI.KPIDetailType',
            DefaultPresentationVariant : ![@UI.PresentationVariant#KPIAvgDailyRevenue]
        }
    },

    // ── 4. Avg Service Value KPI Card ────────────────────────
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

// ── Selection/Presentation Variants for KPIs ──────────────────
annotate service.ServiceTaskSet with @(
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

// ── DataPoint Configurations for KPIs ────────────────────────
annotate service.ServiceTaskSet with @(
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


// ═══════════════════════════════════════════════════════════════
//  ANALYTICS CHARTS
// ═══════════════════════════════════════════════════════════════

annotate service.ServiceTaskSet with @(
    // ── 1. Daily Revenue Overview (Line Chart) ──────────────
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

    // ── 2. Services Count Trend (Column Chart) ──────────────
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

    // ── 3. Service Type Distribution (Donut Chart) ──────────
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

    // ── 4. Service Volume by Type (Column Chart) ────────────
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

    // ── 5. Revenue by Staff Member (Bar Chart) ───────────────
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

    // ── 6. Services by Staff Member (Column Chart) ───────────
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


// ═══════════════════════════════════════════════════════════════
//  ANALYTICS VIEW TABS — SelectionPresentationVariants
// ═══════════════════════════════════════════════════════════════

annotate service.ServiceTaskSet with @(
    // ── Tab 1: Revenue Trends ─────────────────────────────────
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

    // ── Tab 2: Service Distribution ──────────────────────────
    UI.SelectionPresentationVariant#ServiceDistribution: {
        Text              : 'Service Type Distribution',
        SelectionVariant  : {
            SelectOptions : []
        },
        PresentationVariant: {
            Visualizations : ['@UI.Chart#ServiceDistributionDonut', '@UI.Chart#ServiceVolumeByType', '@UI.LineItem']
        }
    },

    // ── Tab 3: Performance ────────────────────────────────────
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
