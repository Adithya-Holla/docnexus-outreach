-- CreateTable
CREATE TABLE "EmailDispatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "physicianId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sequenceStepId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerMessageId" TEXT,
    CONSTRAINT "EmailDispatch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailDispatch_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CampaignEnrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailDispatch_sequenceStepId_fkey" FOREIGN KEY ("sequenceStepId") REFERENCES "SequenceStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dispatchId" TEXT,
    "campaignId" TEXT NOT NULL,
    "physicianId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "providerEventId" TEXT,
    CONSTRAINT "EmailEvent_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "EmailDispatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CampaignEnrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EmailDispatch_campaignId_idx" ON "EmailDispatch"("campaignId");

-- CreateIndex
CREATE INDEX "EmailDispatch_enrollmentId_idx" ON "EmailDispatch"("enrollmentId");

-- CreateIndex
CREATE INDEX "EmailDispatch_sentAt_idx" ON "EmailDispatch"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_providerEventId_key" ON "EmailEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "EmailEvent_campaignId_idx" ON "EmailEvent"("campaignId");

-- CreateIndex
CREATE INDEX "EmailEvent_enrollmentId_idx" ON "EmailEvent"("enrollmentId");

-- CreateIndex
CREATE INDEX "EmailEvent_dispatchId_idx" ON "EmailEvent"("dispatchId");

-- CreateIndex
CREATE INDEX "EmailEvent_eventType_idx" ON "EmailEvent"("eventType");

-- CreateIndex
CREATE INDEX "EmailEvent_timestamp_idx" ON "EmailEvent"("timestamp");
