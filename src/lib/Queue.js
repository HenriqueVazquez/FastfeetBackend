import Bee from 'bee-queue';

import redisConfig from '../config/redis';

import CancellationDeliveryMail from '../app/jobs/CancellationDeliveryMail';
import CreationDeliveryMail from '../app/jobs/CreationDeliveryMail';
import CancellationProblemDeliveryMail from '../app/jobs/CancellationProblemDeliveryMail';

// adiciona os jobs
const jobs = [
  CancellationDeliveryMail,
  CreationDeliveryMail,
  CancellationProblemDeliveryMail,
];

// criando filas
class Queue {
  constructor() {
    this.queues = {};

    this.init();
  }

  // armaenando na fila o bee que é nossa instancia que conecta com o redis

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      };
    });
  }

  // adiciona job dentro da fila

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save();
  }

  // pega os erros dos jobs
  handleFailure(job, err) {
    console.log(`Queue, ${job.queue.name}: FAILED`, err);
  }

  // pega os jobs e precessa em tempo real

  processQueue() {
    jobs.forEach((job) => {
      const { bee, handle } = this.queues[job.key];

      bee.on('failed', this.handleFailure).process(handle);
    });
  }
}

export default new Queue();
