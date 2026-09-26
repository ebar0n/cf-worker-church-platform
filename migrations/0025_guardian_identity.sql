-- A child can have multiple responsible adults with the same role.
-- Keep one link per person, preserving every distinct child/member pair.
CREATE TABLE ChildGuardian_new (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    childId INTEGER NOT NULL,
    memberId INTEGER NOT NULL,
    relationship TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL,
    FOREIGN KEY (childId) REFERENCES Child (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (memberId) REFERENCES Member (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE(childId, memberId)
);

INSERT INTO ChildGuardian_new (id, childId, memberId, relationship, createdAt, updatedAt)
SELECT cg.id, cg.childId, cg.memberId, cg.relationship, cg.createdAt, cg.updatedAt
FROM ChildGuardian cg
WHERE cg.id = (
    SELECT latest.id FROM ChildGuardian latest
    WHERE latest.childId = cg.childId AND latest.memberId = cg.memberId
    ORDER BY latest.updatedAt DESC, latest.id DESC LIMIT 1
);

DROP TABLE ChildGuardian;
ALTER TABLE ChildGuardian_new RENAME TO ChildGuardian;
CREATE INDEX ChildGuardian_childId_idx ON ChildGuardian(childId);
CREATE INDEX ChildGuardian_memberId_idx ON ChildGuardian(memberId);
CREATE INDEX ChildGuardian_relationship_idx ON ChildGuardian(relationship);
