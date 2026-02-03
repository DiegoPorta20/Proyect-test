import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('sent_emails')
export class SentEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column('simple-array')
  to: string[];

  @Column({ nullable: true, type: 'simple-array' })
  cc: string[];

  @Column({ nullable: true, type: 'simple-array' })
  bcc: string[];

  @Column()
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: true })
  isHtml: boolean;

  @Column({ nullable: true })
  templateName: string;

  @Column({ nullable: true, type: 'json' })
  templateData: any;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: 'sent' })
  status: string; // sent, failed, bounced

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
