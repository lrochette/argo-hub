const _ = require('lodash');
const bitBucketServerApi = require('./bitbucket-server.api');

class BitbucketServerService {

    async getPullRequestsWithCommits(repo, branch) {
        try {
            const repoId = await this.getRepoId(repo);

            const prs = await bitBucketServerApi.getPullRequests(repoId, branch);
            return Promise.all(prs.map(async (pr) => {
                const info = await bitBucketServerApi.getCommitsInfo(repoId, pr);
                const result = {
                    ...info,
                    prDate: pr.updatedDate || pr.createdDate,
                    number: pr.id,
                    url: `${pr.links.self[0].href}`,
                    title: pr.title,
                }

                return result;
            }));
        } catch (error) {
            throw new Error(`failed to get pull requests: ${error.message}`)
        }
    }

    async getBranch(repo, branch) {
        try {
            const repoId = await this.getRepoId(repo);

            const bitBucketBranch = await bitBucketServerApi.getBranch(repoId, branch)
            if (!bitBucketBranch) {
                return null
            }
            return {
                name: branch,
                commit: bitBucketBranch.id,
                commitMsg: bitBucketBranch.message,
                commitURL: bitBucketBranch.commitURL,
                committerUsername: _.get(bitBucketBranch, 'author.emailAddress')
            }
        } catch (error) {
            if (_.get(error, 'statusCode') === 404) {
                // branch could be delete, but PR still can be found
                return
            }
            throw new Error(`failed to get branch: ${error.message}`)
        }
    }

    async getRepoId(repoInput) {
        const repo = await bitBucketServerApi.getRepo(repoInput);
        return `${repo.project.key}/${repo.slug}`
    }
}
module.exports = new BitbucketServerService();
