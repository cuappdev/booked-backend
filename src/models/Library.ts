import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BaseEntity } from "typeorm";
import { Room } from "./Room";

// A library building, synced from Cornell's `unit_libraries` endpoint.
@Entity("libraries")
export class Library extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // The library's WordPress post ID on library.cornell.edu.
  @Column({ type: "varchar", unique: true })
  sourceId!: string;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @Column({ type: "varchar", unique: true })
  slug!: string;

  @Column({ type: "varchar", nullable: true })
  address!: string | null;

  @Column({ type: "varchar", nullable: true })
  mapUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", nullable: true })
  email!: string | null;

  @Column({ type: "varchar", nullable: true })
  imageUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  websiteUrl!: string | null;

  @OneToMany(() => Room, (room) => room.library)
  rooms!: Room[];
}
