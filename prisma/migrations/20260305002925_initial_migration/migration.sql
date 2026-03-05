-- CreateTable
CREATE TABLE "Api" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 60,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Api_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "Api"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
