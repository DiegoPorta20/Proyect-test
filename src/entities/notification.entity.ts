import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string; // info, success, warning, error, file_uploaded, email_sent, etc.

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true, type: 'json' })
  data: any;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: 'pending' })
  status: string; // pending, sent, failed

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  readAt: Date;
}
