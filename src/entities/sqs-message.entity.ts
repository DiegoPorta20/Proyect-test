import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('sqs_messages')
export class SqsMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column({ type: 'text' })
  messageBody: string;

  @Column({ nullable: true })
  queueUrl: string;

  @Column({ default: 'sent' })
  status: string; // sent, received, processed, failed

  @Column({ nullable: true })
  delaySeconds: number;

  @Column({ nullable: true, type: 'json' })
  messageAttributes: any;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  processedAt: Date;
}
