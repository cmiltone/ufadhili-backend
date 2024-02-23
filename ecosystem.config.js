exports.apps = [
  {
    name: 'ufadhili-api',
    script: './dist/app.js',
    instances: 1,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  },
];