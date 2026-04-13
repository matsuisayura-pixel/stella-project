# AIT42 Memory System - Quick Start Guide

## 5-Minute Quick Start

### What is the Memory System?

The AIT42 Memory System allows agents to **learn from past executions** by tracking:
- Task history with quality scores
- Agent performance statistics
- Success/failure patterns
- Execution metrics

### File Structure

```
.claude/memory/
├── config.yaml              # System configuration
├── tasks/                   # Task execution records
│   └── 2025-11-04-001-api-implementation.yaml
├── agents/                  # Agent performance stats
│   └── backend-developer-stats.yaml
└── README.md               # Full documentation
```

## Quick Examples

### 1. Check Agent Performance

```bash
# View backend-developer stats
cat .claude/memory/agents/backend-developer-stats.yaml
```

**Output**:
```yaml
agent_name: "backend-developer"
total_tasks: 150
successful_tasks: 142
success_rate: 0.947        # 94.7% success rate
avg_quality_score: 93.2
```

### 2. Find Recent Tasks

```bash
# List last 5 tasks
ls -t .claude/memory/tasks/*.yaml | head -5

# View a task
cat .claude/memory/tasks/2025-11-04-001-api-implementation.yaml
```

### 3. Find Top Performing Agents

```bash
# Find agents with >85% success rate
for file in .claude/memory/agents/*-stats.yaml; do
  rate=$(grep "success_rate:" "$file" | awk '{print $2}')
  if (( $(echo "$rate >= 0.85" | bc -l) )); then
    agent=$(basename "$file" -stats.yaml)
    echo "$agent: $(echo "$rate * 100" | bc -l)%"
  fi
done | sort -t: -k2 -rn
```

## Configuration

Edit `.claude/memory/config.yaml`:

```yaml
max_tasks: 1000           # Max tasks before rotation
retention_days: 90        # Keep tasks for 90 days
backup_enabled: true      # Enable auto-backup

success_rate_threshold:
  preferred: 0.85         # Prefer agents with ≥85% success
  acceptable: 0.70        # Accept agents with ≥70% success
```

## How Coordinator Uses Memory

### Before Task Execution

1. **Load agent stats** for all candidate agents
2. **Score agents** based on:
   - Success rate (40% weight)
   - Quality score (30% weight)
   - Specialization (20% weight)
   - Recent trends (10% weight)
3. **Select top 3 agents** with highest scores
4. **Query similar tasks** for context

### After Task Execution

1. **Create task record** with all metrics
2. **Update agent stats** for each agent:
   - Increment task counters
   - Recalculate success rate
   - Update quality score average
   - Add to recent tasks list
3. **Calculate trends** over last 30 days
4. **Update specializations** based on task type

## Common Queries

### Find High-Quality Tasks

```bash
# Tasks with quality score ≥ 90
grep -l "quality_score: 9[0-9]" .claude/memory/tasks/*.yaml
grep -l "quality_score: 100" .claude/memory/tasks/*.yaml
```

### Find Failed Tasks

```bash
# All failed tasks
grep -l "success: false" .claude/memory/tasks/*.yaml

# View failure details
grep -A 5 "errors:" .claude/memory/tasks/*failed*.yaml
```

### Find Agent Specializations

```bash
# What is backend-developer specialized in?
grep -A 10 "specializations:" \
  .claude/memory/agents/backend-developer-stats.yaml
```

**Example output**:
```yaml
specializations:
  implementation: 80      # 80 implementation tasks
  bug-fix: 25            # 25 bug fixes
  refactoring: 15        # 15 refactoring tasks
```

### Compare Agent Performance

```bash
# Compare success rates
for agent in backend-developer frontend-developer api-developer; do
  rate=$(grep "success_rate:" ".claude/memory/agents/${agent}-stats.yaml" | awk '{print $2}')
  echo "$agent: $(echo "$rate * 100" | bc -l)%"
done
```

## Maintenance

### Create Backup

```bash
# Manual backup
tar -czf ".claude/memory-backup/backup-$(date +%Y-%m-%d).tar.gz" \
  .claude/memory/
```

### Restore Backup

```bash
# Restore from backup
tar -xzf .claude/memory-backup/backup-2025-11-04.tar.gz -C .
```

### Rotate Old Tasks

```bash
# Archive tasks older than 90 days
cd .claude/memory/tasks
tar -czf "../../memory-backup/archive/$(date +%Y-%m)-old-tasks.tar.gz" \
  $(find . -name "*.yaml" -mtime +90)
find . -name "*.yaml" -mtime +90 -delete
```

## Task Record Format

**Minimal task record**:

```yaml
id: "2025-11-04-001"
timestamp: "2025-11-04T14:30:00Z"
request: "User's original request"
task_type: "implementation"
selected_agents:
  - backend-developer
duration_ms: 45000
success: true
quality_score: 95
reflection:
  score: 95
  decision: "approved"
  feedback: "High quality implementation"
```

**Full format**: See `.claude/memory/tasks/2025-11-04-001-api-implementation.yaml`

## Agent Stats Format

```yaml
agent_name: "backend-developer"
total_tasks: 150
successful_tasks: 142
failed_tasks: 8
success_rate: 0.947               # Auto-calculated
avg_quality_score: 93.2           # Rolling average
avg_duration_ms: 30000            # Rolling average
last_updated: "2025-11-04T14:30:00Z"

recent_tasks:                     # Last 10 tasks
  - id: "2025-11-04-001"
    success: true
    score: 95

trends:                           # 30-day trends
  success_rate_trend: 0.05        # +5% improvement
  quality_score_trend: 2.3        # +2.3 points
  avg_duration_trend: -500        # 500ms faster

specializations:                  # Task type counts
  implementation: 80
  bug-fix: 25
```

## Integration Points

### For Coordinator Agent

```python
# Pseudo-code for agent selection
def select_agents(request: str, task_type: str) -> List[str]:
    # 1. Load all agent stats
    stats = {agent: load_stats(agent) for agent in ALL_AGENTS}

    # 2. Score each agent
    scores = {}
    for agent, stat in stats.items():
        scores[agent] = (
            stat['success_rate'] * 0.4 +
            (stat['avg_quality_score'] / 100) * 0.3 +
            (stat['specializations'].get(task_type, 0) / stat['total_tasks']) * 0.2 +
            normalize(stat['trends']['success_rate_trend']) * 0.1
        )

    # 3. Select top 3
    top_agents = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]
    return [agent for agent, score in top_agents]
```

### For Memory Updates

```python
# Pseudo-code for memory update
def update_memory(result: TaskResult):
    # 1. Save task record
    task_id = f"{date}-{seq:03d}"
    save_task(f"tasks/{task_id}-{description}.yaml", result)

    # 2. Update each agent
    for agent in result.agents:
        stats = load_stats(agent)
        stats['total_tasks'] += 1
        stats['successful_tasks'] += result.success
        stats['failed_tasks'] += not result.success
        stats['success_rate'] = stats['successful_tasks'] / stats['total_tasks']
        # ... update other fields
        save_stats(agent, stats)
```

## Troubleshooting

### Problem: Agent stats not updating

**Check**:
1. File permissions: `ls -la .claude/memory/agents/`
2. Last updated timestamp: `grep last_updated .claude/memory/agents/*.yaml`
3. Coordinator logs for errors

### Problem: Task records not created

**Check**:
1. Directory exists: `ls -ld .claude/memory/tasks/`
2. Disk space: `df -h`
3. Write permissions: `touch .claude/memory/tasks/test.yaml && rm .claude/memory/tasks/test.yaml`

### Problem: YAML parse errors

**Fix**:
```bash
# Find invalid YAML
for file in .claude/memory/**/*.yaml; do
  yamllint "$file" 2>&1 || echo "Invalid: $file"
done

# Restore from backup
tar -xzf .claude/memory-backup/latest.tar.gz -C .
```

## Best Practices

1. **Consistent Quality Scores**: Use 0-100 scale consistently
2. **Meaningful Tags**: Tag tasks for easier searching
3. **Regular Backups**: Enable `backup_enabled: true` in config
4. **Monitor Trends**: Review agent trends monthly
5. **Rotate Old Data**: Keep memory size under 100MB
6. **Validate Writes**: Ensure atomic writes to prevent corruption

## Performance Tips

### Optimize Queries

```bash
# Use grep with -l for file lists (faster)
grep -l "task_type: \"implementation\"" .claude/memory/tasks/*.yaml

# Use indexes (future feature)
# Create index: tasks_by_type.json
# Query: jq '.implementation' tasks_by_type.json
```

### Cache Agent Stats

```python
# In Coordinator - cache frequently used stats
cache = {}

def get_stats_cached(agent: str):
    if agent not in cache:
        cache[agent] = load_stats(agent)
    return cache[agent]
```

## Next Steps

1. **Read Full Documentation**: `.claude/memory/README.md`
2. **View Sample Tasks**: `cat .claude/memory/tasks/*.yaml`
3. **Explore Agent Stats**: `cat .claude/memory/agents/coordinator-stats.yaml`
4. **Configure Settings**: Edit `.claude/memory/config.yaml`

## Resources

- **Full Documentation**: [README.md](./README.md)
- **Validation Report**: [VALIDATION.md](./VALIDATION.md)
- **Configuration**: [config.yaml](./config.yaml)
- **Sample Tasks**: `tasks/` directory
- **Agent Stats**: `agents/` directory

---

**Need Help?**
- Check README.md for detailed documentation
- Review sample files in `tasks/` and `agents/`
- Contact AIT42 development team

**Version**: 1.4.0
**Last Updated**: 2025-11-04
