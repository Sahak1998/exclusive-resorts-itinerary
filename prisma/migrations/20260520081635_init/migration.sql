-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "villa" TEXT NOT NULL,
    "arrivalDate" DATETIME NOT NULL,
    "departureDate" DATETIME NOT NULL,
    CONSTRAINT "Reservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reservationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME,
    "approvedAt" DATETIME,
    "paidAt" DATETIME,
    CONSTRAINT "Proposal_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProposalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProposalItem_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SentEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bodyPreview" TEXT NOT NULL,
    CONSTRAINT "SentEmail_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
