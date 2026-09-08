DROP INDEX "Payment_provider_externalId_key";
CREATE UNIQUE INDEX "Payment_propertyId_provider_externalId_key" ON "Payment"("propertyId", provider, "externalId");
CREATE UNIQUE INDEX "Refund_paymentId_externalId_key" ON "Refund"("paymentId", "externalId");
