namespace WashWizard;

entity ServiceTask {
    key Guid : UUID;
    
    // Contact Details
    CustomerName : String(100);
    Phone : String(10);
    
    // Vehicle Details
    CarModel : String(100);
    VehiclePlate : String(20);
    
    // Service & Pricing Details
    ServiceType : String(500);
    Amount : Decimal(10,2);
    PaymentMethod : String(20);
    
    // Lifecycle Details
    Status : String(20) default 'Pending';
    Date : Date; // Native CDS Date type — HANA maps to DATE column
    CompletedAt : Date;
}
