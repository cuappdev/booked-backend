import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  Index,
  BaseEntity
} from "typeorm";
import { Library } from "./Library";
import { User } from "./User";

export type ReservationType = "Reservable" | "By request" | "No reservation";

// A single room or study area, synced from Cornell's `library_spaces` endpoint.
@Entity("rooms")
@Index(["source", "sourceId"], { unique: true })
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  source!: string;

  @Column({ type: "varchar" })
  sourceId!: string;

  @Column({ type: "varchar", unique: true })
  slug!: string;

  @Column({ type: "varchar" })
  title!: string;

  // Cornell's API no longer exposes the description or Reserve link; both
  // stay empty until a sync reads them from the room's page (`sourceUrl`).
  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", nullable: true })
  reservationUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  imageUrl!: string | null;

  @Column({ type: "varchar", nullable: true })
  sourceUrl!: string | null;

  @Column({ type: "varchar", array: true, default: "{}" })
  spaceTypes!: string[];

  @Column({ type: "varchar", default: "No reservation" })
  reservationType!: ReservationType;

  @Column({ type: "varchar", array: true, default: "{}" })
  soundLevels!: string[];

  @Column({ type: "varchar", array: true, default: "{}" })
  activities!: string[];

  @Column({ type: "varchar", array: true, default: "{}" })
  amenities!: string[];

  @Column({ type: "varchar", array: true, default: "{}" })
  audiences!: string[];

  @Column({ type: "boolean", default: false })
  accessible!: boolean;

  @Column({ type: "varchar", array: true, default: "{}" })
  support!: string[];

  // When Cornell last edited the room, as opposed to when we last synced it.
  @Column({ type: "timestamptz", nullable: true })
  sourceUpdatedAt!: Date | null;

  @Column({ type: "timestamptz" })
  lastSyncedAt!: Date;

  // Cornell's API doesn't say which library a room is in, so this stays
  // empty until a sync reads it from the room's page.
  @Column({ type: "uuid", nullable: true })
  libraryId!: string | null;

  @ManyToOne(() => Library, (library) => library.rooms, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "libraryId" })
  library!: Library | null;

  @ManyToMany(() => User, (user) => user.favRooms, { onDelete: "CASCADE" })
  favoritedBy!: User[];
}
