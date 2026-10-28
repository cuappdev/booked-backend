import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1793225671892 implements MigrationInterface {
    name = 'InitialSchema1793225671892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "libraries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sourceId" character varying NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "address" character varying, "mapUrl" character varying, "phone" character varying, "email" character varying, "imageUrl" character varying, "websiteUrl" character varying, CONSTRAINT "UQ_03b3dc1eb6cb625437c6a210945" UNIQUE ("sourceId"), CONSTRAINT "UQ_9fb3b11b4181af695b7cbf06d49" UNIQUE ("name"), CONSTRAINT "UQ_e393d54208f6dc4b924ef2eb6d3" UNIQUE ("slug"), CONSTRAINT "PK_505fedfcad00a09b3734b4223de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source" character varying NOT NULL, "sourceId" character varying NOT NULL, "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "reservationUrl" character varying, "imageUrl" character varying, "sourceUrl" character varying, "spaceTypes" character varying array NOT NULL DEFAULT '{}', "reservationType" character varying NOT NULL DEFAULT 'No reservation', "soundLevels" character varying array NOT NULL DEFAULT '{}', "activities" character varying array NOT NULL DEFAULT '{}', "amenities" character varying array NOT NULL DEFAULT '{}', "audiences" character varying array NOT NULL DEFAULT '{}', "accessible" boolean NOT NULL DEFAULT false, "support" character varying array NOT NULL DEFAULT '{}', "sourceUpdatedAt" TIMESTAMP WITH TIME ZONE, "lastSyncedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "libraryId" uuid, CONSTRAINT "UQ_4a252a005ce573079b47a4f38e3" UNIQUE ("slug"), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d348789ca4bd18240142930c7" ON "rooms" ("source", "sourceId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "netId" character varying NOT NULL, "email" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2f4a4a20da86367b6eae408250f" UNIQUE ("netId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_favorites_rooms" ("userId" uuid NOT NULL, "roomId" uuid NOT NULL, CONSTRAINT "PK_9f8a644db72199f03da7bcbfd6e" PRIMARY KEY ("userId", "roomId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9bbbd64635495f235fc87f8786" ON "user_favorites_rooms" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_80fb7a0e08fb6eb77f51a67ff8" ON "user_favorites_rooms" ("roomId") `);
        await queryRunner.query(`ALTER TABLE "rooms" ADD CONSTRAINT "FK_e8051b33c5c0fd2bc4b500d5521" FOREIGN KEY ("libraryId") REFERENCES "libraries"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorites_rooms" ADD CONSTRAINT "FK_9bbbd64635495f235fc87f8786c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_favorites_rooms" ADD CONSTRAINT "FK_80fb7a0e08fb6eb77f51a67ff89" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_favorites_rooms" DROP CONSTRAINT "FK_80fb7a0e08fb6eb77f51a67ff89"`);
        await queryRunner.query(`ALTER TABLE "user_favorites_rooms" DROP CONSTRAINT "FK_9bbbd64635495f235fc87f8786c"`);
        await queryRunner.query(`ALTER TABLE "rooms" DROP CONSTRAINT "FK_e8051b33c5c0fd2bc4b500d5521"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_80fb7a0e08fb6eb77f51a67ff8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bbbd64635495f235fc87f8786"`);
        await queryRunner.query(`DROP TABLE "user_favorites_rooms"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d348789ca4bd18240142930c7"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TABLE "libraries"`);
    }

}
