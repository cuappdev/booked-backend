import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  CreateDateColumn,
  BaseEntity
} from "typeorm";
import { Library } from "./Library";
import { User } from "./User";

@Entity("rooms")
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

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "varchar", nullable: true })
  imageUrl!: string;

  @Column({ type: "varchar", nullable: true })
  sourceUrl!: string;

  @Column({ type: "varchar", nullable: true })
  reservationUrl!: string;

  @Column({ type: "varchar", nullable: true })
  noiseLevel!: string;

  @Column({ type: "simple-array", nullable: true })
  spaceFeatures!: string[];

  @Column({ type: "simple-array", nullable: true })
  audienceTypes!: string[];

  @CreateDateColumn({ type: "timestamp" })
  lastSyncedAt!: Date;

  @ManyToOne(() => Library, (library) => library.rooms, { onDelete: "CASCADE" })
  @JoinColumn({ name: "libraryId" })
  library!: Library;

  @ManyToMany(() => User, (user) => user.favRooms)
  favoritedBy!: User[];
}