import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity
} from "typeorm";
import { Room } from "./Room";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  netId!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;

  @ManyToMany(() => Room, (room) => room.favoritedBy)
  @JoinTable({
    name: "user_favorites_rooms",
    joinColumn: { name: "userId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "roomId", referencedColumnName: "id" },
  })
  favRooms!: Room[];
}