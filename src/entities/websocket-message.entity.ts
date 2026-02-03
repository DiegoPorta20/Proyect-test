import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('websocket_messages')
export class WebsocketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromUserId: string;

  @Column()
  toUserId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'sent' })
  status: string; // sent, delivered, read

  @Column({ nullable: true })
  room: string;

  @Column({ default: 'direct' })
  type: string; // direct, broadcast, room

  @Column({ nullable: true, type: 'json' })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  readAt: Date;
}
