const { modelByEntity } = require('./models');

async function applyChange(change) {
  const { entity, operation, payload } = change;
  const Model = modelByEntity[entity];

  if (!Model) {
    return {
      ok: false,
      reason: `Unsupported entity: ${entity}`,
      changeId: change.id
    };
  }

  if (!payload || !payload.id) {
    return {
      ok: false,
      reason: 'Payload must include id.',
      changeId: change.id
    };
  }

  if (operation === 'delete') {
    await Model.deleteOne({ id: payload.id });
    return { ok: true, operation, entity, payloadId: payload.id, changeId: change.id };
  }

  if (operation === 'create' || operation === 'update') {
    await Model.updateOne(
      { id: payload.id },
      { $set: { ...payload } },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return { ok: true, operation, entity, payloadId: payload.id, changeId: change.id };
  }

  return {
    ok: false,
    reason: `Unsupported operation: ${operation}`,
    changeId: change.id
  };
}

async function applySyncQueue(changes) {
  const results = [];

  for (const change of changes) {
    try {
      const result = await applyChange(change);
      results.push(result);
    } catch (error) {
      results.push({
        ok: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        changeId: change.id
      });
    }
  }

  return results;
}

module.exports = { applySyncQueue };
