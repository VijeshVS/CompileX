const amqp = require('amqplib/callback_api');

const queue = 'code-judge';
const message = {
    code: `
        #include <stdio.h>
        int add(int a, int b) {
            return a + b;
        }
    `,
    time_limit: 1000,
    memory_limit: 256,
    test_cases: [
        {
            input: "2 3",
            expected_output: "5"
        },
        {
            input: "10 15",
            expected_output: "25"
        }
    ],
    language: 'c',
    commit_id: '73hnd3hqh8dhqndnjqdwj'
};

amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queue, {
            durable: false
        });

        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        console.log(" [x] Sent %s", message);
    });

    setTimeout(function() {
        connection.close();
        process.exit(0);
    }, 500);
});
