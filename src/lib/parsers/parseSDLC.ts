import { readDataFile, extractSection, parseMarkdownTable } from './shared';

export interface SDLCViolation {
  date: string;
  project: string;
  code: string;
  severity: string;
  description: string;
}

export interface SDLCStage {
  stage: string;
  who: string;
  gate: string;
  enforcedBy: string;
}

export interface ViolationCode {
  code: string;
  name: string;
  severity: string;
  example: string;
}

export interface SDLCData {
  violations: SDLCViolation[];
  stages: SDLCStage[];
  violationCodes: ViolationCode[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

export function parseSDLC(): SDLCData | null {
  const violationsMd = readDataFile('sdlcViolations');
  const processMd = readDataFile('sdlcProcess');

  if (!violationsMd && !processMd) return null;

  // Parse violations
  const violations: SDLCViolation[] = [];
  if (violationsMd) {
    const rows = parseMarkdownTable(violationsMd);
    for (const row of rows) {
      violations.push({
        date: row['Date'] || '',
        project: row['Project'] || '',
        code: row['Code'] || '',
        severity: row['Severity'] || '',
        description: row['Description'] || '',
      });
    }
  }

  // Parse process stages
  const stages: SDLCStage[] = [];
  const violationCodes: ViolationCode[] = [];
  if (processMd) {
    const stageSection = extractSection(processMd, '8-Stage Pipeline (every code change)');
    for (const row of parseMarkdownTable(stageSection)) {
      stages.push({
        stage: row['Stage'] || '',
        who: row['Who'] || '',
        gate: row['Gate'] || '',
        enforcedBy: row['Enforced by'] || '',
      });
    }

    const codeSection = extractSection(processMd, 'Violation Codes');
    for (const row of parseMarkdownTable(codeSection)) {
      violationCodes.push({
        code: row['Code'] || '',
        name: row['Name'] || '',
        severity: row['Severity'] || '',
        example: row['Example'] || '',
      });
    }
  }

  return {
    violations,
    stages,
    violationCodes,
    criticalCount: violations.filter(v => v.severity === 'Critical').length,
    highCount: violations.filter(v => v.severity === 'High').length,
    mediumCount: violations.filter(v => v.severity === 'Medium').length,
  };
}
