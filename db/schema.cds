namespace WashWizard;
using { managed } from '@sap/cds/common';

entity ServiceTask : managed {
    @readonly key Guid : UUID;
    
    // Contact Details
    @mandatory CustomerName : String(100);
    @mandatory Phone : String(10);
    
    // Vehicle Details
    @mandatory CarModel : String(100);
    @mandatory VehiclePlate : String(20);
    
    // Service & Pricing Details
    @mandatory ServiceType : String(500);
    @mandatory Amount : Decimal(10,2);
    @mandatory PaymentMethod : String(20);
    
    // Lifecycle Details
    Status : String(20) enum { Pending; Washing; Drying; Completed; Cancelled; } default 'Pending';
    @readonly Date : Date; // Native CDS Date type — HANA maps to DATE column
    @readonly CompletedAt : Date;

    // Association to the User who handled it
    HandledBy : Association to Users;
}

entity Users {
    key Username : String(50);
    Password : String(100);
    Role : String(20) default 'Staff'; // 'Admin' or 'Staff'
}

entity CarModelMaster {
    key ID : UUID;
    Brand : String(100);
    ModelName : String(100);
}

entity ServiceCatalog {
    key ID : UUID;
    Category : String(50); // Washing, Interior, Coating
    ServiceName : String(100);
    Price : Decimal(10,2);
}
