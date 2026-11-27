import type { StageLesson, StageProps, StageStep } from '../engine/StageLesson'
import { Arrow, Box, Caption, Term, d } from './kit'

// Supermicro's own tools next to the open ones: in-band and out-of-band, IPMICFG, SMCIPMITool, SUM,
// SuperDoctor 5 and SSM, SAA on new boards, the same jobs at other vendors, and the lab's stand-ins.

type Scene = 'bands' | 'gen' | 'ipmicfg' | 'smcipmitool' | 'sum' | 'sd5' | 'saa' | 'map' | 'lab'
export interface VendorStep extends StageStep {
  scene: Scene
}

function Bands({ hot }: { hot?: 'in' | 'out' }) {
  return (
    <g>
      <rect x={40} y={170} width={160} height={110} rx="10" className="vt-laptop" />
      <text x={120} y={230} textAnchor="middle" className="fb-strong">
        your laptop
      </text>
      <rect x={300} y={60} width={640} height={330} rx="12" className="sw-chassis" />
      <text x={620} y={50} textAnchor="middle" className="fb-label">
        one server
      </text>
      <rect x={340} y={100} width={300} height={250} rx="10" className="vt-os" />
      <text x={490} y={130} textAnchor="middle" className="fb-strong">
        host: CPUs, memory, OS
      </text>
      <rect x={380} y={160} width={220} height={60} rx="8" className={`vt-tool${hot === 'in' ? ' is-hot' : ''}`} />
      <text x={490} y={196} textAnchor="middle" className="fb-small">
        in-band tool
      </text>
      <rect x={720} y={150} width={180} height={130} rx="10" className="vt-bmc" />
      <text x={810} y={205} textAnchor="middle" className="fb-strong">
        BMC
      </text>
      <text x={810} y={226} textAnchor="middle" className="fb-tiny">
        own chip, own port
      </text>
      <path d="M600 190 H720" className={`vt-link is-in${hot === 'in' ? ' is-hot' : ''}`} />
      <text x={660} y={182} textAnchor="middle" className="fb-tiny">
        host interface
      </text>
      <path d="M200 225 H260 V420 H810 V280" className={`vt-link is-out${hot === 'out' ? ' is-hot' : ''}`} />
      <text x={530} y={412} textAnchor="middle" className="fb-tiny">
        management network
      </text>
      {hot === 'in' && <path d="M600 190 H720" className="fb-light" />}
      {hot === 'out' && <path d="M200 225 H260 V420 H810 V280" className="fb-light" />}
    </g>
  )
}

const JOBS: [string, string, string, string, string, string][] = [
  ['', 'Supermicro', 'Dell', 'HPE', 'Lenovo', 'open'],
  ['the BMC', 'BMC (IPMI, Redfish)', 'iDRAC', 'iLO', 'XCC', 'OpenBMC'],
  ['remote CLI', 'SMCIPMITool, SAA', 'racadm', 'iLOrest', 'OneCLI', 'ipmitool, curl'],
  ['firmware', 'SUM, SAA', 'racadm, DSU', 'SUM + SPP', 'OneCLI', 'Redfish update'],
  ['BIOS settings', 'SUM, SAA', 'racadm', 'iLOrest', 'OneCLI', 'Redfish Bios'],
]

export function VendorStage({ steps, cur, replayKey }: StageProps<VendorStep>) {
  const st = steps[Math.max(0, cur)]
  const s = st.scene
  return (
    <div className="fb">
      <svg key={`${cur}:${replayKey}`} viewBox="0 0 1000 480" className="fb-svg" role="img" aria-label={st.title}>
        {s === 'bands' && (
          <>
            <Bands hot="out" />
            <g className="fb-in" style={d(1.6)}>
              <rect x={380} y={160} width={220} height={60} rx="8" className="vt-tool is-hot" />
              <text x={490} y={196} textAnchor="middle" className="fb-small">
                in-band tool
              </text>
              <path d="M600 190 H720" className="fb-light" />
            </g>
            <Caption y={458}>Out of band: over the network to the BMC, even with the server off. In band: from inside the running OS.</Caption>
          </>
        )}

        {s === 'gen' && (
          <>
            <Box x={50} y={50} w={420} h={190} title="Board names" lines={['X = Intel boards, H = AMD boards', 'the number is the generation:', 'X13 / H13, X14 / H14 ...', 'the tools list which ones they support']} tone="info" delay={0.2} />
            <Box x={530} y={50} w={420} h={190} title="BMC login" lines={['user ADMIN', 'a unique password per board, printed', 'on a sticker (since late 2019, no more', 'ADMIN / ADMIN)']} tone="warn" delay={0.8} />
            <Caption y={310} delay={1.4}>
              The password goes in the site's password vault, never in a ticket, a script or a screenshot.
            </Caption>
          </>
        )}

        {s === 'ipmicfg' && (
          <>
            <Box x={60} y={50} w={300} h={110} title="server OS" lines={['ipmicfg runs here,', 'no install needed']} tone="amber" delay={0.2} center />
            <path d="M360 105 H600" className="vt-link is-in is-hot" />
            <path d="M360 105 H600" className="fb-light" />
            <text x={480} y={95} textAnchor="middle" className="fb-tiny">
              host interface, inside the box
            </text>
            <Box x={600} y={50} w={300} h={110} title="BMC" lines={['its address, users,', 'reset, factory defaults']} tone="violet" delay={0.4} center />
            <Term
              x={60}
              y={200}
              w={840}
              delay={0.8}
              lines={['$ ipmicfg -m                    # show the BMC IP and MAC', '$ ipmicfg -dhcp off', '$ ipmicfg -m 10.70.1.12         # set the BMC IP', '$ ipmicfg -k 255.255.255.0      # mask', '$ ipmicfg -g 10.70.1.1          # gateway', '$ ipmicfg -r                    # cold reset of the BMC']}
            />
            <Caption y={440} delay={1.4}>
              IPMICFG: in band, on Linux, Windows, UEFI or DOS. Sets a BMC address from the OS when nobody knows it.
            </Caption>
          </>
        )}

        {s === 'smcipmitool' && (
          <>
            <Box x={40} y={70} w={260} h={110} title="your laptop" lines={['SMCIPMITool']} tone="blue" delay={0.2} center />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <path d={`M300 125 C 420 125 460 ${70 + k * 50} 600 ${70 + k * 50}`} className="vt-link is-out is-hot" />
                <path d={`M300 125 C 420 125 460 ${70 + k * 50} 600 ${70 + k * 50}`} className="fb-light" style={d(0.3 * k)} />
                <Box x={600} y={50 + k * 50} w={280} h={40} title={`BMC rk-n${k + 1}`} tone="violet" />
              </g>
            ))}
            <text x={450} y={40} textAnchor="middle" className="fb-tiny">
              management network
            </text>
            <Term x={40} y={230} w={920} delay={0.8} lines={['$ SMCIPMITool 10.70.1.12 ADMIN <password> ipmi power status', '$ SMCIPMITool 10.70.1.12 ADMIN <password> ipmi sensor', '# run it with no command: it prints everything it can do']} />
            <Caption y={420} delay={1.4}>
              SMCIPMITool: out of band, one BMC or many. The ipmitool jobs plus Supermicro's own extras.
            </Caption>
          </>
        )}

        {s === 'sum' && (
          <>
            <Term
              x={40}
              y={30}
              w={920}
              delay={0.2}
              lines={[
                '$ sum -i 10.70.1.12 -u ADMIN -p <pw> -c GetBiosInfo',
                '$ sum -i 10.70.1.12 -u ADMIN -p <pw> -c GetCurrentBiosCfg --file node12.xml',
                '$ diff golden.xml node12.xml          # one setting drifted?',
                '$ sum -i 10.70.1.12 -u ADMIN -p <pw> -c ChangeBiosCfg --file golden.xml',
                '$ sum -i 10.70.1.12 -u ADMIN -p <pw> -c UpdateBios --file BIOS_X13.bin',
              ]}
            />
            <Box x={40} y={180} w={440} h={140} title="SUM: Supermicro Update Manager" lines={['BIOS and BMC firmware, BIOS settings', 'as a file you can diff and push,', 'in band or out of band, node by node', 'or for a list of nodes']} tone="info" delay={1} />
            <Box x={520} y={180} w={440} h={140} title="Licence" lines={['each target node needs a key', '(SFT-OOB-LIC or SFT-DCMS-SINGLE),', 'activated on its BMC']} tone="warn" delay={1.6} />
            <Caption y={380} delay={2}>
              A golden settings file, compared and pushed per node, is how a rack ends up with identical BIOS settings.
            </Caption>
          </>
        )}

        {s === 'sd5' && (
          <>
            {[0, 1, 2].map((k) => (
              <g key={k} className="fb-in" style={d(0.2 + k * 0.3)}>
                <rect x={60} y={60 + k * 120} width={300} height={90} rx="10" className="sw-chassis" />
                <rect x={80} y={80 + k * 120} width={170} height={50} rx="6" className="vt-tool is-hot" />
                <text x={165} y={110 + k * 120} textAnchor="middle" className="fb-tiny">
                  SuperDoctor 5 agent
                </text>
                <Arrow x1={370} y1={105 + k * 120} x2={560} y2={225} delay={0.6 + k * 0.3} />
              </g>
            ))}
            <rect x={570} y={150} width={370} height={150} rx="10" className="vt-dash" />
            <text x={755} y={190} textAnchor="middle" className="fb-strong">
              alerts and a dashboard
            </text>
            <text x={755} y={216} textAnchor="middle" className="fb-small">
              temperatures, fans, voltages,
            </text>
            <text x={755} y={236} textAnchor="middle" className="fb-small">
              OS services: e-mail or SNMP
            </text>
            <Caption y={440}>SuperDoctor 5 watches health from inside the OS; Supermicro Server Manager (SSM) watches many servers.</Caption>
          </>
        )}

        {s === 'saa' && (
          <>
            {['SUM', 'SMCIPMITool', 'IPMICFG'].map((t, i) => (
              <g key={t}>
                <Box x={60} y={60 + i * 110} w={260} h={80} title={t} tone="slate" delay={0.2 + i * 0.2} center />
                <Arrow x1={330} y1={100 + i * 110} x2={540} y2={210} delay={0.8 + i * 0.2} />
              </g>
            ))}
            <Box x={550} y={130} w={400} h={160} title="SAA" lines={['SuperServer Automation Assistant', 'one CLI for update, configuration', 'and BMC work, X12 / H12 and newer']} tone="ok" delay={1.6} center />
            <Caption y={420} delay={2}>
              On X14 / H14, Supermicro no longer supports IPMICFG and SMCIPMITool: new racks mean SAA.
            </Caption>
          </>
        )}

        {s === 'map' && (
          <>
            {JOBS.map((row, r) => (
              <g key={r} className="fb-in" style={d(0.15 + r * 0.25)}>
                {row.map((cell, c) => (
                  <g key={c}>
                    <rect x={20 + c * 162} y={60 + r * 66} width={156} height={56} rx="7" className={r === 0 || c === 0 ? 'kit-box is-slate' : c === 1 ? 'kit-box is-info' : 'kit-box is-plain'} />
                    <text x={98 + c * 162} y={93 + r * 66} textAnchor="middle" className={r === 0 || c === 0 ? 'fb-strong' : 'fb-small'}>
                      {cell}
                    </text>
                  </g>
                ))}
              </g>
            ))}
            <Caption y={420} delay={1.6}>
              Every vendor has its own names for the same four jobs. ipmitool and Redfish work across all of them.
            </Caption>
          </>
        )}

        {s === 'lab' && (
          <>
            <Term
              x={60}
              y={40}
              w={880}
              delay={0.2}
              lines={['# rackbench-lab: emulated BMCs, real commands', '$ ipmitool -I lanplus -H 127.0.0.1 -p 6231 -U admin -P password power status', '+Chassis Power is on', '$ curl -s http://127.0.0.1:8000/redfish/v1/Systems', '$ ./lab/fw.sh list                 # a stand-in for SUM: BIOS version per node', '$ ./lab/fw.sh update rk-n2 1.5      # flash, then cold boot']}
            />
            <Caption y={260} delay={1}>
              The vendor tools need real Supermicro boards; the jobs and the habits are the same in the lab.
            </Caption>
          </>
        )}
      </svg>
    </div>
  )
}

export const VENDOR_TOOLS: StageLesson<VendorStep> = {
  Stage: VendorStage,
  metrics: [
    { id: 'tool', label: 'Tool', start: '-' },
    { id: 'band', label: 'Path', start: '-' },
  ],
  intro: [
    'Every server vendor ships its own tools next to the open standards. On Supermicro racks you will meet IPMICFG, SMCIPMITool, SUM, SuperDoctor 5 and, on new boards, SAA. They do the same jobs as ipmitool and Redfish, plus vendor extras such as BIOS settings files.',
    'Command forms below follow Supermicro\'s guides; run each tool without arguments for the exact options of your version.',
  ],
  legend: [
    ['In band', 'From inside the server\'s running OS'],
    ['Out of band', 'Over the management network to the BMC, even with the server off'],
    ['SUM', 'Supermicro Update Manager: firmware and BIOS settings'],
    ['SAA', 'SuperServer Automation Assistant: the newer all-in-one CLI'],
  ],
  steps: [
    { scene: 'bands', short: 'Two paths', title: 'In band and out of band', explain: ['Out-of-band tools run on your laptop and talk to the BMC over the management network, so they work even when the server is off or its OS is broken. In-band tools run inside the server\'s OS and reach the BMC through the host interface.', 'Every vendor tool is one or the other, or both.'], key: 'Out of band = over the network to the BMC; in band = from the OS.', m: { band: 'both' } },
    { scene: 'gen', short: 'Boards', title: 'Board names and the BMC login', explain: ['Supermicro boards start with X for Intel and H for AMD, then the generation: X13 and H13, X14 and H14. Tools state which generations they support.', 'The BMC user is ADMIN. Since late 2019 each board ships with its own password on a sticker, instead of the old ADMIN/ADMIN. It belongs in the password vault, never in a ticket or a script.'], key: 'X Intel, H AMD, number = generation; unique BMC password on the sticker.', m: { tool: 'BMC login' } },
    { scene: 'ipmicfg', short: 'IPMICFG', title: 'IPMICFG: set up the BMC from the OS', tag: 'technique', explain: ['IPMICFG runs in band, without installing, on Linux, Windows, a UEFI shell or DOS. Its classic job: a server arrives and nobody knows its BMC address, so you boot it and set the address, mask and gateway from the OS.', 'It can also cold-reset the BMC (-r) or restore factory defaults (-fd, which wipes the BMC settings and users: careful).'], key: 'IPMICFG: in band, fixes the BMC\'s own settings from the host.', m: { tool: 'IPMICFG', band: 'in band' } },
    { scene: 'smcipmitool', short: 'SMCIPMITool', title: 'SMCIPMITool: the remote CLI', tag: 'technique', explain: ['SMCIPMITool works out of band against one BMC or a list of them: power, sensors, the event log, virtual media, users. The form is the BMC address, user and password, then the command, such as `ipmi power status`.', 'It covers what ipmitool does, plus Supermicro\'s own features.'], key: 'SMCIPMITool: out of band, address user password command.', m: { tool: 'SMCIPMITool', band: 'out of band' } },
    { scene: 'sum', short: 'SUM', title: 'SUM: firmware and BIOS settings', tag: 'technique', explain: ['Supermicro Update Manager updates BIOS and BMC firmware and reads or writes the BIOS settings as a file, in band or out of band. Export the settings of a node, diff them against the golden file, and push the golden file where they drift.', 'SUM needs a licence key on each target node (SFT-OOB-LIC or SFT-DCMS-SINGLE).'], key: 'SUM: firmware updates and BIOS settings files you can diff and push.', m: { tool: 'SUM', band: 'both' } },
    { scene: 'sd5', short: 'SD5, SSM', title: 'SuperDoctor 5 and SSM: watching health', explain: ['SuperDoctor 5 is an agent inside the OS that watches temperatures, fans, voltages and OS services and sends alerts. Supermicro Server Manager (SSM) watches many servers from one place.'], key: 'SD5 watches one server from inside; SSM watches many.', m: { tool: 'SuperDoctor 5', band: 'in band' } },
    { scene: 'saa', short: 'SAA', title: 'SAA on new boards', tag: 'event', explain: ['SuperServer Automation Assistant (SAA) brings the features of SUM, SMCIPMITool and IPMICFG into one CLI, for X12/H12 boards and newer. Supermicro does not support IPMICFG and SMCIPMITool on X14/H14, so a new rack is an SAA rack.'], key: 'New boards: SAA replaces the separate CLI tools.', m: { tool: 'SAA', band: 'both' } },
    { scene: 'map', short: 'Other vendors', title: 'The same jobs at every vendor', explain: ['Dell has iDRAC and racadm, HPE has iLO, iLOrest and its own Smart Update Manager with the Service Pack for ProLiant, Lenovo has the XClarity Controller and OneCLI. The jobs are the same: reach the BMC, run commands, update firmware, set the BIOS.', 'ipmitool and Redfish work on all of them, which is why they are worth knowing first.'], key: 'Learn the jobs and the open tools; the vendor names map onto them.', m: { tool: 'by vendor' } },
    { scene: 'lab', short: 'In the lab', title: 'Practise the jobs in the lab', tag: 'result', explain: ['The vendor tools need real Supermicro boards. In rackbench-lab, ipmitool and Redfish talk to emulated BMCs, and fw.sh stands in for SUM: BIOS versions per node, a flash, then a cold boot, as in the BIOS update lesson.'], key: 'Same jobs, same habits, emulated hardware.', m: { tool: 'ipmitool, fw.sh', band: 'out of band' } },
  ],
}
