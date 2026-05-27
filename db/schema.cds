namespace WashWizard;
using { cuid, managed } from '@sap/cds/common';

// ── Main transactional entity ──────────────────────────────────

entity ServiceTask : cuid, managed {
    @title: 'Customer Name'    CustomerName  : String(100) @mandatory;
    @title: 'Phone'            Phone         : String(10)  @mandatory;
    @title: 'Car Model'        CarModel      : String(100) @mandatory;
    @title: 'Vehicle Plate'    VehiclePlate  : String(20)  @mandatory;
    @title: 'Service Type'     ServiceType   : String(500) @mandatory;
    @title: 'Amount'           Amount        : Decimal(10,2) @mandatory;
    @title: 'Payment Method'   PaymentMethod : String(20)  default 'Online';
    @title: 'Status'           Status        : String(20)  default 'Pending';
    @title: 'Service Date'     ServiceDate   : Date;
    @title: 'Completed At'     CompletedAt   : Date;
    @title: 'Handled By'       HandledBy     : String(50);
}

// ── User accounts (display only — auth via mock/XSUAA) ─────────

entity Users {
    @title: 'Username'  key Username : String(50);
    @title: 'Role'          Role     : String(20) default 'Staff';
}

// ── Master data for car model value-help ────────────────────────

entity CarModelMaster : cuid, managed {
    @title: 'Brand'       Brand     : String(100);
    @title: 'Model Name'  ModelName : String(100);
}

// ── Service pricing catalog ─────────────────────────────────────

entity ServiceCatalog : cuid, managed {
    @title: 'Category'      Category    : String(50);
    @title: 'Service Name'  ServiceName : String(100);
    @title: 'Price'         Price       : Decimal(10,2);
}
