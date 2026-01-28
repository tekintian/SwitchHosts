/**
 * run
 * @author: oldj
 * @homepage: https://oldj.net
 */

import { cfgdb } from '@main/data'
import { ICommandRunResult } from '@common/data'
import { exec } from 'child_process'
import { broadcast } from '@main/core/agent'
import events from '@common/events'

// List of allowed command prefixes (security whitelist)
const ALLOWED_COMMANDS = [
  '/usr/bin/',
  '/bin/',
  '/usr/local/bin/',
  '/usr/sbin/',
  '/sbin/',
  'echo',
  'ping',
  'curl',
  'wget',
  'systemctl',
  'scutil',
  'dscacheutil',
]

const MAX_OUTPUT_SIZE = 1024 * 1024 // 1MB max output size
const CMD_TIMEOUT = 10000 // 10 seconds timeout

/**
 * Validate command against whitelist
 */
const validateCommand = (cmd: string): { valid: boolean; reason?: string } => {
  if (!cmd || typeof cmd !== 'string') {
    return { valid: false, reason: 'Command is empty or invalid' }
  }

  const trimmedCmd = cmd.trim()

  // Check command length
  if (trimmedCmd.length > 1000) {
    return { valid: false, reason: 'Command too long' }
  }

  // Check against allowed prefixes
  const isAllowed = ALLOWED_COMMANDS.some((prefix) => trimmedCmd.startsWith(prefix))
  if (!isAllowed) {
    return {
      valid: false,
      reason: `Command must start with one of: ${ALLOWED_COMMANDS.join(', ')}`,
    }
  }

  // Check for dangerous shell operators
  const dangerousPatterns = ['&&', '||', '|', ';', '`', '$(', '>', '<', '&', '\n']
  const containsDangerous = dangerousPatterns.some((pattern) => trimmedCmd.includes(pattern))
  if (containsDangerous) {
    return { valid: false, reason: 'Command contains dangerous operators' }
  }

  return { valid: true }
}

const run = (cmd: string): Promise<ICommandRunResult> =>
  new Promise((resolve) => {
    // Validate command before execution
    const validation = validateCommand(cmd)
    if (!validation.valid) {
      console.error(`Command validation failed: ${validation.reason}`)
      resolve({
        success: false,
        stdout: '',
        stderr: `Security: ${validation.reason}`,
        add_time_ms: new Date().getTime(),
      })
      return
    }

    exec(cmd, { timeout: CMD_TIMEOUT, maxBuffer: MAX_OUTPUT_SIZE }, (error, stdout, stderr) => {
      // command output is in stdout
      let success: boolean = !error

      // Truncate output if too large
      if (stdout.length > MAX_OUTPUT_SIZE) {
        stdout = stdout.substring(0, MAX_OUTPUT_SIZE) + '\n... (output truncated)'
      }
      if (stderr.length > MAX_OUTPUT_SIZE) {
        stderr = stderr.substring(0, MAX_OUTPUT_SIZE) + '\n... (output truncated)'
      }

      resolve({
        success,
        stdout,
        stderr,
        add_time_ms: new Date().getTime(),
      })
    })
  })

export default async () => {
  let cmd = await cfgdb.dict.cfg.get('cmd_after_hosts_apply')

  if (!cmd || typeof cmd !== 'string' || !cmd.trim()) {
    return
  }

  console.log(`to run cmd...`)
  let result = await run(cmd)
  console.log(result)

  // Log command execution for audit
  console.log(`[AUDIT] Command executed: success=${result.success}`)

  await cfgdb.collection.cmd_history.insert(result)
  broadcast(events.cmd_run_result, result)

  // auto delete old records
  const max_records = 200
  let all = await cfgdb.collection.cmd_history.all<ICommandRunResult>()
  if (all.length > max_records) {
    let n = all.length - max_records
    for (let i = 0; i < n; i++) {
      await cfgdb.collection.cmd_history.delete((item) => item._id === all[i]._id)
    }
  }

  global.tracer.add(`cmd:${result.success ? 1 : 0}`)
}
